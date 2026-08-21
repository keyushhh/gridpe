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
  english: "en-IN",
  hi: "hi-IN",
  hindi: "hi-IN",
  kn: "kn-IN",
  kannada: "kn-IN",
  ta: "ta-IN",
  tamil: "ta-IN",
  te: "te-IN",
  telugu: "te-IN",
  mr: "mr-IN",
  marathi: "mr-IN",
  gu: "gu-IN",
  gujarati: "gu-IN",
  bn: "bn-IN",
  bengali: "bn-IN",
  bangla: "bn-IN",
  ml: "ml-IN",
  malayalam: "ml-IN",
  pa: "pa-IN",
  punjabi: "pa-IN",
  or: "od-IN",
  od: "od-IN",
  odia: "od-IN",
  oriya: "od-IN",
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
