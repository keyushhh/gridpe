/**
 * Server-side FX pricing.
 *
 * WHY THIS EXISTS
 * ---------------
 * create-fx-exchange-order used to take fx_rate, markup_amount, flat_fee and
 * receive_amount straight from the request body and charge against them. Only
 * the delivery/platform/GST layer was recomputed (via get_order_quote), and
 * that layer is computed *from* receive_amount — so a client that inflated the
 * rate moved the whole quote with it and the mismatch guard never fired.
 *
 * Cash orders do not have this hole: there the customer picks a plain rupee
 * amount and the server prices everything downstream of it. FX has a second
 * pricing step (the conversion) that had no server-side equivalent. This
 * module is that equivalent.
 *
 * The rule: the client's figures are a *claim*, checked for agreement and then
 * discarded. Every number that reaches the payment gateway or the order row is
 * computed here from a rate this server fetched itself.
 *
 * The arithmetic deliberately mirrors src/pages/FxExchange.tsx exactly,
 * including its approximations. Changing the formula here without changing it
 * there would reject every honest order, so pricing changes must land in both.
 */

/** Grid.Pe's margin on the conversion. Mirrors FxExchange.tsx markupPercent. */
export const FX_MARKUP_PERCENT = 0.006;

/** Flat fee, always quoted in INR. Mirrors FxExchange.tsx FLAT_FEE_INR. */
export const FX_FLAT_FEE_INR = 150;

/**
 * How far the client's rate may drift from the server's before we refuse.
 * The app locks a displayed rate for ~10 minutes, so some drift is honest;
 * this is wide enough for that and far too tight for a forged rate.
 */
export const FX_RATE_TOLERANCE_PCT = 0.02;

/** Rupee tolerance when comparing the client's converted figures to ours. */
export const FX_AMOUNT_TOLERANCE = 1;

/** Currencies the exchange flow accepts. Anything else is rejected outright. */
export const FX_SUPPORTED_CURRENCIES = [
  "INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD", "CAD", "JPY", "CHF",
] as const;

export type FxCurrency = (typeof FX_SUPPORTED_CURRENCIES)[number];

export interface FxQuote {
  rate: number;
  convertedAmount: number;
  markupAmount: number;
  flatFee: number;
  receiveAmount: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function isSupportedCurrency(code: unknown): code is FxCurrency {
  return typeof code === "string" &&
    (FX_SUPPORTED_CURRENCIES as readonly string[]).includes(code);
}

/**
 * The flat fee expressed in the TO currency.
 *
 * ponytail: the neither-side-is-INR branch divides by a hardcoded 86, copied
 * from the client. It is wrong whenever USD/INR is not 86, but it is wrong
 * identically on both sides, so quotes still agree. Fix it in FxExchange.tsx
 * and here together, using a real INR cross-rate, before FX ships broadly.
 */
export function flatFeeInToCurrency(
  from: string,
  to: string,
  rate: number,
): number {
  if (to === "INR") return FX_FLAT_FEE_INR;
  if (from === "INR") return FX_FLAT_FEE_INR * rate;
  return FX_FLAT_FEE_INR / 86;
}

/**
 * Price a conversion from a rate this server obtained. This is the only place
 * an FX receive_amount may come from.
 */
export function computeFxQuote(
  sourceAmount: number,
  from: string,
  to: string,
  rate: number,
): FxQuote {
  const convertedAmount = sourceAmount * rate;
  const markupAmount = convertedAmount * FX_MARKUP_PERCENT;
  const flatFee = flatFeeInToCurrency(from, to, rate);
  const receiveAmount = convertedAmount - markupAmount - flatFee;

  return {
    rate,
    convertedAmount: round2(convertedAmount),
    markupAmount: round2(markupAmount),
    flatFee: round2(flatFee),
    // A conversion smaller than the fees is not an order; callers reject it.
    receiveAmount: round2(Math.max(receiveAmount, 0)),
  };
}

/**
 * A tip is client-supplied and is added to the payable total, so a negative or
 * malformed value would quietly discount the order (the client would simply
 * send the lowered total to match). Clamp before it reaches any arithmetic.
 */
export function clampTip(tip: unknown): number {
  const n = Number(tip);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100) / 100;
}

export interface FxValidationFailure {
  error: string;
  message: string;
}

/**
 * Check the client's claimed figures against the server's own quote.
 *
 * Returning null means "the client agrees with us". It does NOT mean the
 * client's numbers should be used — callers still charge the server quote.
 */
export function validateClientFxQuote(
  server: FxQuote,
  client: { fx_rate?: unknown; receive_amount?: unknown },
): FxValidationFailure | null {
  const clientRate = Number(client.fx_rate);
  const clientReceive = Number(client.receive_amount);

  if (!Number.isFinite(clientRate) || clientRate <= 0) {
    return { error: "invalid_fx_rate", message: "Exchange rate is missing or invalid" };
  }
  if (!Number.isFinite(clientReceive) || clientReceive <= 0) {
    return { error: "invalid_receive_amount", message: "Converted amount is missing or invalid" };
  }

  const rateDrift = Math.abs(clientRate - server.rate) / server.rate;
  if (rateDrift > FX_RATE_TOLERANCE_PCT) {
    return {
      error: "fx_rate_mismatch",
      message: "The exchange rate has moved. Please refresh the quote and try again.",
    };
  }

  if (Math.abs(clientReceive - server.receiveAmount) > FX_AMOUNT_TOLERANCE) {
    return {
      error: "fx_amount_mismatch",
      message: "The converted amount has changed. Please refresh the quote and try again.",
    };
  }

  return null;
}

/**
 * Fetch a FROM->TO rate from the upstream the app already uses for live rates.
 *
 * Throws on any failure. Callers MUST let that failure reject the order: there
 * is no safe fallback, because the only other source of a rate is the client,
 * and not trusting the client is the entire point of this module.
 */
export async function fetchFxRate(
  from: string,
  to: string,
  fetchImpl: typeof fetch = fetch,
): Promise<number> {
  if (from === to) return 1;

  const url =
    `https://api.frankfurter.dev/v1/latest?base=${encodeURIComponent(from)}&symbols=${encodeURIComponent(to)}`;
  const res = await fetchImpl(url);
  if (!res.ok) {
    throw new Error(`FX rate lookup failed: ${res.status}`);
  }

  const data = await res.json();
  const rate = data?.rates?.[to];
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
    throw new Error(`FX rate lookup returned no usable rate for ${from}->${to}`);
  }
  return rate;
}
