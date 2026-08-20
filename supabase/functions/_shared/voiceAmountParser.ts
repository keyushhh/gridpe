/**
 * Voice-specific amount extraction helper for cash orders.
 * 
 * Handles:
 * 1. Bare digits / numbers in sentence: "2000", "I need 1500"
 * 2. 'k' slang multiplier: "2k", "2.5k", "5k", "10k"
 * 3. English number words: "two thousand", "five hundred", "fifteen hundred", "twenty five hundred"
 * 4. Hindi / Hinglish number words: "paanch sau", "do hazaar", "pandrah sau", "das hazar", "ek lakh"
 * 5. Devanagari digits & words: "२०००", "दो हज़ार", "पाँच सौ", "५००"
 * 
 * Enforces valid cash amount range: [500, 100,000]
 */

export const MIN_CASH_AMOUNT = 500;
export const MAX_CASH_AMOUNT = 100000;

export function isValidCashAmount(amount: number): boolean {
  return typeof amount === "number" && !isNaN(amount) && amount >= MIN_CASH_AMOUNT && amount <= MAX_CASH_AMOUNT;
}

const DEVANAGARI_DIGIT_MAP: Record<string, string> = {
  "०": "0", "१": "1", "२": "2", "३": "3", "४": "4",
  "५": "5", "६": "6", "७": "7", "८": "8", "९": "9",
};

function normalizeDevanagariDigits(text: string): string {
  return text.replace(/[०-९]/g, (digit) => DEVANAGARI_DIGIT_MAP[digit] || digit);
}

const NUMBER_WORDS: Record<string, number> = {
  // English units & teens
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  // English tens
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  // English multipliers
  hundred: 100,
  thousand: 1000,
  lakh: 100000,
  lac: 100000,
  lakhs: 100000,
  lacs: 100000,

  // Hindi / Hinglish units & teens
  ek: 1,
  do: 2,
  teen: 3,
  char: 4,
  chaar: 4,
  paanch: 5,
  panch: 5,
  che: 6,
  chhah: 6,
  saat: 7,
  aath: 8,
  nau: 9,
  das: 10,
  dus: 10,
  gyarah: 11,
  barah: 12,
  terah: 13,
  chaudah: 14,
  pandrah: 15,
  solah: 16,
  satrah: 17,
  atharah: 18,
  unnis: 19,
  unnees: 19,
  // Hindi tens & special compounds
  bees: 20,
  pachees: 25,
  pachis: 25,
  tees: 30,
  paintees: 35,
  chalis: 40,
  paintalis: 45,
  pachaas: 50,
  pachas: 50,
  // Hindi multipliers
  sau: 100,
  so: 100,
  hazaar: 1000,
  hazar: 1000,
  hajar: 1000,

  // Devanagari Words
  "एक": 1,
  "दो": 2,
  "तीन": 3,
  "चार": 4,
  "पाँच": 5,
  "पांच": 5,
  "छह": 6,
  "सात": 7,
  "आठ": 8,
  "नौ": 9,
  "दस": 10,
  "ग्यारह": 11,
  "बारह": 12,
  "तेरह": 13,
  "चौदह": 14,
  "पंद्रह": 15,
  "सोलह": 16,
  "सत्रह": 17,
  "अट्ठारह": 18,
  "उन्नीस": 19,
  "बीस": 20,
  "पच्चीस": 25,
  "तीस": 30,
  "पैंतीस": 35,
  "चालीस": 40,
  "पचास": 50,
  "सौ": 100,
  "हज़ार": 1000,
  "हजार": 1000,
  "लाख": 100000,
};

/**
 * Parses spoken number words (e.g. "two thousand five hundred", "fifteen hundred", "do hazaar paanch sau")
 */
function parseWordsToNumber(text: string): number | null {
  const cleaned = text
    .replace(/[^\w\s\u0900-\u097F]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();

  // Special Hindi prefixes: "dedh hazaar" (1500), "dhai hazaar" (2500)
  if (/\b(dedh|derh|डेढ़)\s+(hazaar|hazar|hajar|thousand|हज़ार|हजार)\b/i.test(cleaned)) {
    return 1500;
  }
  if (/\b(dhai|dhayi|ढाई)\s+(hazaar|hazar|hajar|thousand|हज़ार|हजार)\b/i.test(cleaned)) {
    return 2500;
  }

  const tokens = cleaned.split(" ");
  let total = 0;
  let currentGroup = 0;
  let hasValidWord = false;

  for (const token of tokens) {
    if (!token) continue;

    if (token in NUMBER_WORDS) {
      hasValidWord = true;
      const val = NUMBER_WORDS[token];

      if (val === 100000) {
        currentGroup = (currentGroup || 1) * val;
        total += currentGroup;
        currentGroup = 0;
      } else if (val === 1000) {
        currentGroup = (currentGroup || 1) * val;
        total += currentGroup;
        currentGroup = 0;
      } else if (val === 100) {
        currentGroup = (currentGroup || 1) * val;
      } else {
        currentGroup += val;
      }
    } else if (/^\d+$/.test(token)) {
      // Inline digits like "15 sau" or "2 hazaar"
      hasValidWord = true;
      const val = parseInt(token, 10);
      currentGroup += val;
    }
  }

  total += currentGroup;
  return hasValidWord && total > 0 ? total : null;
}

/**
 * Main fallback parser for voice cash orders.
 */
export function extractVoiceCashAmount(transcript: string): number | null {
  if (!transcript || typeof transcript !== "string") return null;

  const raw = normalizeDevanagariDigits(transcript.trim());

  // 1. Check for 'k' slang: e.g. "2k", "2.5k", "5k", "10k"
  const kMatch = raw.match(/\b(\d+(?:\.\d+)?)\s*k\b/i);
  if (kMatch && kMatch[1]) {
    const val = Math.round(parseFloat(kMatch[1]) * 1000);
    if (isValidCashAmount(val)) return val;
  }

  // 2. Check for explicit currency patterns with digits: e.g. "₹2000", "2000 rupees", "rs 1500", "500/-"
  const currencyMatch = raw.match(/(?:₹|\brs\.?\b|\binr\b|\brupees\b|\brupaye\b|\bरुपये\b)\s*([0-9][0-9,]*(?:\.\d{1,2})?)/i)
    ?? raw.match(/\b([0-9][0-9,]*(?:\.\d{1,2})?)\s*(?:₹|\brs\.?\b|\binr\b|\brupees\b|\brupaye\b|\bरुपये\b|\/-)/i);
  if (currencyMatch && currencyMatch[1]) {
    const val = Number(currencyMatch[1].replaceAll(",", ""));
    if (isValidCashAmount(val)) return val;
  }

  // 3. Check number words in English or Hindi / Hinglish: e.g. "two thousand", "five hundred", "paanch sau", "do hazaar"
  const wordsVal = parseWordsToNumber(raw);
  if (wordsVal !== null && isValidCashAmount(wordsVal)) {
    return wordsVal;
  }

  // 4. Fallback to bare digits in the voice transcript: e.g. "2000", "I need 1500", "send 5000"
  const digitMatches = raw.matchAll(/\b([0-9][0-9,]*)(?:\.\d{1,2})?\b/g);
  for (const match of digitMatches) {
    if (match && match[1]) {
      const val = Number(match[1].replaceAll(",", ""));
      if (isValidCashAmount(val)) {
        return val;
      }
    }
  }

  return null;
}

/**
 * --- VERIFICATION / TEST EXAMPLES ---
 * 
 * ✅ Bare Digits:
 * extractVoiceCashAmount("2000") -> 2000
 * extractVoiceCashAmount("I need 1500") -> 1500
 * extractVoiceCashAmount("cash 5000 please") -> 5000
 * extractVoiceCashAmount("Send 2500") -> 2500
 * 
 * ✅ 'K' Slang:
 * extractVoiceCashAmount("2k") -> 2000
 * extractVoiceCashAmount("2.5k") -> 2500
 * extractVoiceCashAmount("5k cash") -> 5000
 * extractVoiceCashAmount("10k") -> 10000
 * 
 * ✅ English Number Words:
 * extractVoiceCashAmount("two thousand") -> 2000
 * extractVoiceCashAmount("five hundred") -> 500
 * extractVoiceCashAmount("one thousand five hundred") -> 1500
 * extractVoiceCashAmount("fifteen hundred") -> 1500
 * extractVoiceCashAmount("twenty five hundred") -> 2500
 * extractVoiceCashAmount("ten thousand rupees") -> 10000
 * 
 * ✅ Hindi / Hinglish Words:
 * extractVoiceCashAmount("paanch sau") -> 500
 * extractVoiceCashAmount("do hazaar") -> 2000
 * extractVoiceCashAmount("dedh hazaar") -> 1500
 * extractVoiceCashAmount("dhai hazar") -> 2500
 * extractVoiceCashAmount("das hazar rupaye") -> 10000
 * extractVoiceCashAmount("500 rupaye") -> 500
 * extractVoiceCashAmount("दो हज़ार") -> 2000
 * extractVoiceCashAmount("पाँच सौ रुपये") -> 500
 * extractVoiceCashAmount("२०००") -> 2000
 * 
 * ❌ Correctly Rejected (Out of bounds [500, 100000] or invalid):
 * extractVoiceCashAmount("300") -> null (below 500 limit)
 * extractVoiceCashAmount("two hundred") -> null (below 500 limit)
 * extractVoiceCashAmount("200000") -> null (above 100k limit)
 * extractVoiceCashAmount("hello what is my balance") -> null (no amount)
 * extractVoiceCashAmount("where is my rider") -> null (no amount)
 */
