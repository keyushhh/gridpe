/** Shared defaults for calls to Sarvam's REST API. */
export const SARVAM_API_BASE_URL = "https://api.sarvam.ai";
export const SARVAM_API_KEY_ENV = "SARVAM_API_KEY";

export const SARVAM_DEFAULT_TIMEOUT_MS = 15_000;
export const SARVAM_DEFAULT_MAX_RETRIES = 2;
export const SARVAM_RETRY_BASE_DELAY_MS = 250;
export const SARVAM_DEFAULT_CHAT_MODEL = "sarvam-105b";

export const SUPABASE_URL_ENV = "SUPABASE_URL";
export const SUPABASE_ANON_KEY_ENV = "SUPABASE_ANON_KEY";

export const SARVAM_LANGUAGE_MAP: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  kn: "kn-IN",
  ta: "ta-IN",
  te: "te-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  bn: "bn-IN",
  ml: "ml-IN",
  pa: "pa-IN",
  or: "od-IN",
};

export function toSarvamLanguageCode(lang?: string | null): string {
  if (!lang) return "en-IN";
  const normalized = lang.toLowerCase().trim();
  if (normalized === "unknown" || normalized === "auto") {
    return "unknown";
  }
  if (SARVAM_LANGUAGE_MAP[normalized]) {
    return SARVAM_LANGUAGE_MAP[normalized];
  }
  const [code, region] = normalized.split("-");
  if (SARVAM_LANGUAGE_MAP[code]) {
    return SARVAM_LANGUAGE_MAP[code];
  }
  return region ? `${code}-${region.toUpperCase()}` : `${code}-IN`;
}
