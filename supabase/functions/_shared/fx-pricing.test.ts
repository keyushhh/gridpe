/**
 * Run with:  deno test supabase/functions/_shared/fx-pricing.test.ts
 *
 * These cover the hole this module was written to close: a client that sends
 * a forged rate or a forged converted amount must not be able to move the
 * price. Everything here is pure arithmetic plus one injected fetch, so no
 * Supabase, no network and no gateway are involved.
 */

import { assert, assertAlmostEquals, assertEquals } from "jsr:@std/assert@1";
import {
  clampTip,
  computeFxQuote,
  fetchFxRate,
  FX_FLAT_FEE_INR,
  FX_MARKUP_PERCENT,
  isSupportedCurrency,
  validateClientFxQuote,
} from "./fx-pricing.ts";

const USD_INR = 87.36;

Deno.test("computeFxQuote matches the client formula for USD->INR", () => {
  const q = computeFxQuote(100, "USD", "INR", USD_INR);
  const converted = 100 * USD_INR;                 // 8736
  const markup = converted * FX_MARKUP_PERCENT;    // 52.416
  assertAlmostEquals(q.convertedAmount, converted, 0.01);
  assertAlmostEquals(q.markupAmount, markup, 0.01);
  assertEquals(q.flatFee, FX_FLAT_FEE_INR);
  assertAlmostEquals(q.receiveAmount, converted - markup - FX_FLAT_FEE_INR, 0.01);
});

Deno.test("flat fee is converted when the payout is not in INR", () => {
  const rate = 1 / USD_INR;
  const q = computeFxQuote(10000, "INR", "USD", rate);
  // reported to 2dp; receiveAmount below is computed from the unrounded value
  assertAlmostEquals(q.flatFee, FX_FLAT_FEE_INR * rate, 0.01);
  const converted = 10000 * rate;
  const expected = converted - converted * FX_MARKUP_PERCENT - FX_FLAT_FEE_INR * rate;
  assertAlmostEquals(q.receiveAmount, expected, 0.01);
});

Deno.test("a conversion smaller than the fees floors at zero, never negative", () => {
  const q = computeFxQuote(1, "USD", "INR", USD_INR); // ~87 in, 150 flat fee
  assertEquals(q.receiveAmount, 0);
});

Deno.test("an honest client passes validation", () => {
  const server = computeFxQuote(100, "USD", "INR", USD_INR);
  const fail = validateClientFxQuote(server, {
    fx_rate: USD_INR,
    receive_amount: server.receiveAmount,
  });
  assertEquals(fail, null);
});

Deno.test("a stale quote is refused rather than silently repriced", () => {
  const server = computeFxQuote(100, "USD", "INR", USD_INR);
  // The customer's quote is internally honest but was priced 0.5% ago. The
  // rate is inside FX_RATE_TOLERANCE_PCT, so it is not treated as forged, but
  // 0.5% of this order is ~Rs 44 and the amount tolerance is Rs 1 - so it is
  // refused and the customer re-confirms. That is deliberate: the server
  // charges its own quote, and charging a price the customer was never shown
  // would be worse than asking them to refresh.
  const staleRate = USD_INR * 1.005;
  const stale = computeFxQuote(100, "USD", "INR", staleRate);
  const fail = validateClientFxQuote(server, {
    fx_rate: staleRate,
    receive_amount: stale.receiveAmount,
  });
  assertEquals(fail?.error, "fx_amount_mismatch");
});

Deno.test("THE ATTACK: a forged rate is rejected", () => {
  const server = computeFxQuote(100, "USD", "INR", USD_INR);
  const forged = computeFxQuote(100, "USD", "INR", 200); // claim $1 = Rs 200
  const fail = validateClientFxQuote(server, {
    fx_rate: 200,
    receive_amount: forged.receiveAmount,
  });
  assertEquals(fail?.error, "fx_rate_mismatch");
});

Deno.test("THE ATTACK: an honest rate with an inflated payout is rejected", () => {
  const server = computeFxQuote(100, "USD", "INR", USD_INR);
  const fail = validateClientFxQuote(server, {
    fx_rate: USD_INR,
    receive_amount: server.receiveAmount * 2,
  });
  assertEquals(fail?.error, "fx_amount_mismatch");
});

Deno.test("THE ATTACK: zero markup and zero flat fee are rejected", () => {
  const server = computeFxQuote(100, "USD", "INR", USD_INR);
  // a client that simply drops our margin and fee from its own arithmetic
  const fail = validateClientFxQuote(server, {
    fx_rate: USD_INR,
    receive_amount: 100 * USD_INR,
  });
  assertEquals(fail?.error, "fx_amount_mismatch");
});

Deno.test("missing or nonsense client figures are rejected, not defaulted", () => {
  const server = computeFxQuote(100, "USD", "INR", USD_INR);
  assertEquals(
    validateClientFxQuote(server, { receive_amount: server.receiveAmount })?.error,
    "invalid_fx_rate",
  );
  assertEquals(
    validateClientFxQuote(server, { fx_rate: USD_INR, receive_amount: -1 })?.error,
    "invalid_receive_amount",
  );
  assertEquals(
    validateClientFxQuote(server, { fx_rate: 0, receive_amount: 100 })?.error,
    "invalid_fx_rate",
  );
});

Deno.test("currency allowlist", () => {
  assert(isSupportedCurrency("USD"));
  assert(!isSupportedCurrency("XYZ"));
  assert(!isSupportedCurrency(undefined));
});

Deno.test("fetchFxRate reads the upstream rate", async () => {
  const stub = ((_url: string) =>
    Promise.resolve(
      new Response(JSON.stringify({ rates: { INR: USD_INR } }), { status: 200 }),
    )) as unknown as typeof fetch;
  assertEquals(await fetchFxRate("USD", "INR", stub), USD_INR);
});

Deno.test("fetchFxRate throws rather than returning a fallback", async () => {
  const dead = (() =>
    Promise.resolve(new Response("nope", { status: 500 }))) as unknown as typeof fetch;
  let threw = false;
  try {
    await fetchFxRate("USD", "INR", dead);
  } catch {
    threw = true;
  }
  assert(threw, "a failed rate lookup must throw so the caller can fail closed");
});

Deno.test("fetchFxRate rejects a malformed upstream payload", async () => {
  const junk = (() =>
    Promise.resolve(
      new Response(JSON.stringify({ rates: { INR: "eighty" } }), { status: 200 }),
    )) as unknown as typeof fetch;
  let threw = false;
  try {
    await fetchFxRate("USD", "INR", junk);
  } catch {
    threw = true;
  }
  assert(threw);
});

Deno.test("same-currency conversion needs no upstream call", async () => {
  const explode = (() => {
    throw new Error("should not be called");
  }) as unknown as typeof fetch;
  assertEquals(await fetchFxRate("INR", "INR", explode), 1);
});

// --- tip clamping (applies to both cash and FX orders) --------------------

Deno.test("tip: an honest tip is kept, to the paisa", () => {
  assertEquals(clampTip(20), 20);
  assertEquals(clampTip("35.5"), 35.5);
  assertEquals(clampTip(10.129), 10.13);
});

Deno.test("THE ATTACK: a negative tip cannot discount the order", () => {
  assertEquals(clampTip(-500), 0);
  assertEquals(clampTip("-0.01"), 0);
  assertEquals(clampTip(-Infinity), 0);
});

Deno.test("tip: malformed values fall back to zero, never to NaN", () => {
  assertEquals(clampTip(undefined), 0);
  assertEquals(clampTip(null), 0);
  assertEquals(clampTip("abc"), 0);
  assertEquals(clampTip(NaN), 0);
  assertEquals(clampTip({}), 0);
  assertEquals(clampTip([]), 0);
});
