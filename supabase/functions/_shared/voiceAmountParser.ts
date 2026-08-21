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

const INDIC_DIGIT_MAP: Record<string, string> = {
  // Devanagari (Hindi, Marathi, Nepali)
  "०": "0", "१": "1", "२": "2", "३": "3", "४": "4",
  "५": "5", "६": "6", "७": "7", "८": "8", "९": "9",
  // Bengali / Assamese
  "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
  "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
  // Gujarati
  "૦": "0", "૧": "1", "૨": "2", "૩": "3", "૪": "4",
  "૫": "5", "૬": "6", "૭": "7", "૮": "8", "૯": "9",
  // Gurmukhi (Punjabi)
  "੦": "0", "੧": "1", "੨": "2", "੩": "3", "੪": "4",
  "੫": "5", "੬": "6", "੭": "7", "੮": "8", "੯": "9",
  // Odia
  "୦": "0", "୧": "1", "୨": "2", "୩": "3", "୪": "4",
  "୫": "5", "୬": "6", "୭": "7", "୮": "8", "୯": "9",
  // Tamil
  "௦": "0", "௧": "1", "௨": "2", "௩": "3", "௪": "4",
  "௫": "5", "௬": "6", "௭": "7", "௮": "8", "௯": "9",
  // Telugu
  "౦": "0", "౧": "1", "౨": "2", "౩": "3", "౪": "4",
  "౫": "5", "౬": "6", "౭": "7", "౮": "8", "౯": "9",
  // Kannada
  "೦": "0", "೧": "1", "೨": "2", "೩": "3", "೪": "4",
  "೫": "5", "೬": "6", "೭": "7", "೮": "8", "೯": "9",
  // Malayalam
  "൦": "0", "൧": "1", "൨": "2", "൩": "3", "൪": "4",
  "൫": "5", "൬": "6", "൭": "7", "൮": "8", "൯": "9",
};

function normalizeIndicDigits(text: string): string {
  return text.replace(/[\u0966-\u096F\u09E6-\u09EF\u0A66-\u0A6F\u0AE6-\u0AEF\u0B66-\u0B6F\u0BE6-\u0BEF\u0C66-\u0C6F\u0CE6-\u0CEF\u0D66-\u0D6F]/g, (digit) => INDIC_DIGIT_MAP[digit] || digit);
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

  // Devanagari Words (Hindi / Marathi)
  "एक": 1,
  "दो": 2,
  "दोन": 2,
  "तीन": 3,
  "चार": 4,
  "पाँच": 5,
  "पांच": 5,
  "पाच": 5,
  "छह": 6,
  "सहा": 6,
  "सात": 7,
  "आठ": 8,
  "नौ": 9,
  "नऊ": 9,
  "दस": 10,
  "दहा": 10,
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
  "वीस": 20,
  "पच्चीस": 25,
  "तीस": 30,
  "पैंतीस": 35,
  "चालीस": 40,
  "चाळीस": 40,
  "पचास": 50,
  "पन्नास": 50,
  "सौ": 100,
  "शे": 100,
  "पाचशे": 500,
  "हज़ार": 1000,
  "हजार": 1000,
  "लाख": 100000,

  // Bengali Words (Script & Romanized)
  "এক": 1,
  "দুই": 2,
  "দু": 2,
  "তিন": 3,
  "চার": 4,
  "পাঁচ": 5,
  "ছয়": 6,
  "সাত": 7,
  "আট": 8,
  "নয়": 9,
  "দশ": 10,
  "পনেরো": 15,
  "কুড়ি": 20,
  "বিশ": 20,
  "পঁচিশ": 25,
  "ত্রিশ": 30,
  "চল্লিশ": 40,
  "পঞ্চাশ": 50,
  "শত": 100,
  "শো": 100,
  "একশো": 100,
  "দুশো": 200,
  "তিনশো": 300,
  "চারশো": 400,
  "পাঁচশো": 500,
  "পাঁচশত": 500,
  "ছয়শো": 600,
  "সাতশো": 700,
  "আটশো": 800,
  "নয়শো": 900,
  "হাজার": 1000,
  "লাখ": 100000,
  eksho: 100,
  duso: 200,
  dushho: 200,
  tinsho: 300,
  charsho: 400,
  panchsho: 500,
  paanchsho: 500,
  pachsho: 500,
  pachso: 500,
  pancho: 500,
  choyso: 600,
  shatsho: 700,
  aatsho: 800,
  noyso: 900,
    hajaar: 1000,
  hazari: 1000,

  // Kannada Words
  "ಒಂದು": 1,
  "ಎರಡು": 2,
  "ಮೂರು": 3,
  "ನಾಲ್ಕು": 4,
  "ಐದು": 5,
  "ఆరు": 6,
  "ఏడు": 7,
  "ಎಂಟು": 8,
  "ಒಂಬತ್ತು": 9,
  "ಹತ್ತು": 10,
  "ಇಪ್ಪತ್ತು": 20,
  "ಮೂವತ್ತು": 30,
  "ನಲವತ್ತು": 40,
  "ಐವತ್ತು": 50,
  "ನೂರು": 100,
  "ಇನ್ನೂರು": 200,
  "ಮನ್ನೂರು": 300,
  "ನಾನ್ನೂರು": 400,
  "ಐನೂರು": 500,
  "ಆರುನೂರು": 600,
  "ಎಳುನೂರು": 700,
  "ಎಂಟುನೂರು": 800,
  "ಒಂಬೈನೂರು": 900,
  "ಸಾವಿರ": 1000,
  "ಲಕ್ಷ": 100000,
  ainuru: 500,
  savira: 1000,
  saavira: 1000,

  // Tamil Words
  "ஒன்று": 1,
  "இரண்டு": 2,
  "மூன்று": 3,
  "நான்கு": 4,
  "ஐந்து": 5,
  "ஆறு": 6,
  "ஏழு": 7,
  "எட்டு": 8,
  "ஒன்பது": 9,
  "பத்து": 10,
  "இருபது": 20,
  "முப்பது": 30,
  "நாற்பது": 40,
  "ஐம்பது": 50,
  "நூறு": 100,
  "இருநூறு": 200,
  "முந்நூறு": 300,
  "நானூறு": 400,
  "ஐந்நூறு": 500,
  "ஆயிரம்": 1000,
  "இரண்டாயிரம்": 2000,
  "மூன்றாயிரம்": 3000,
  "ஐந்தாயிரம்": 5000,
  "பத்தாயிரம்": 10000,
  "இருபதாயிரம்": 20000,
  "ஐம்பதாயிரம்": 50000,
  "லட்சம்": 100000,
  ainooru: 500,
  aayiram: 1000,

  // Telugu Words
  "ఒకటి": 1,
  "ఒక": 1,
  "రెండు": 2,
  "మూడు": 3,
  "నాలుగు": 4,
  "ఐదు": 5,
  "ఆరు": 6,
  "ఏడు": 7,
  "ఎనిమిది": 8,
  "తొమ్మిది": 9,
  "పది": 10,
  "ఇరవై": 20,
  "ముప్పై": 30,
  "నలభై": 40,
  "యాభై": 50,
  "వంద": 100,
  "వందలు": 100,
  "రెండు వందలు": 200,
  "మూడు వందలు": 300,
  "నాలుగు వందలు": 400,
  "ఐదు వందలు": 500,
  "ఐదొందలు": 500,
  "వెయ్యಿ": 1000,
  "వేలు": 1000,
  "రెండు వేలు": 2000,
  "మూడు వేలు": 3000,
  "ఐదు వేలు": 5000,
  "పది వేలు": 10000,
  "ఇరవై వేలు": 20000,
  "యాభై వేలు": 50000,
  "లక్ష": 100000,
  veyyi: 1000,
  velu: 1000,
  vandalu: 100,

  // Malayalam Words
  "ഒന്ന്": 1,
  "രണ്ട്": 2,
  "മൂന്ന്": 3,
  "നാല്": 4,
  "അഞ്ച്": 5,
  "ആറ്": 6,
  "ഏഴ്": 7,
  "എട്ട്": 8,
  "ഒമ്പത്": 9,
  "പത്ത്": 10,
  "ഇരുപത്": 20,
  "മുപ്പത്": 30,
  "നാല്പത്": 40,
  "അമ്പത്": 50,
  "നൂറ്": 100,
  "ഇരുനൂറ്": 200,
  "മുന്നൂറ്": 300,
  "നാനൂറ്": 400,
  "അഞ്ഞൂറ്": 500,
  "ആയിരം": 1000,
  "രണ്ടായിരം": 2000,
  "മൂവായിരം": 3000,
  "അയ്യായിരം": 5000,
  "പതിനായിരം": 10000,
  "ലക്ഷം": 100000,

  // Gujarati Words
  "એક": 1,
  "બે": 2,
  "ત્રણ": 3,
  "ચાર": 4,
  "પાંચ": 5,
  "છ": 6,
  "સાત": 7,
  "આઠ": 8,
  "નવ": 9,
  "દસ": 10,
  "વીસ": 20,
  "ત્રીસ": 30,
  "ચાલીસ": 40,
  "પચાસ": 50,
  "સો": 100,
  "બસો": 200,
  "ત્રણસો": 300,
  "ચારસો": 400,
  "પાંચસો": 500,
  "હજાર": 1000,
  "લાખ": 100000,

  // Punjabi Words
  "ਇੱਕ": 1,
  "ਦੋ": 2,
  "ਤਿੰਨ": 3,
  "ਚਾਰ": 4,
  "ਪੰਜ": 5,
  "ਛੇ": 6,
  "ਸੱਤ": 7,
  "ਅੱਠ": 8,
  "ਨੌਂ": 9,
  "ਦਸ": 10,
  "ਵੀਹ": 20,
  "ਤੀਹ": 30,
  "ਚਾਲੀ": 40,
  "ਪੰਜਾਹ": 50,
  "ਸੌ": 100,
  "ਪੰਜ ਸੌ": 500,
  "ਪੰਜਸੌ": 500,
  "ਹਜ਼ਾਰ": 1000,
  "ਲੱਖ": 100000,

  // Odia Words
  "ଏକ": 1,
  "ଦୁଇ": 2,
  "ତିନି": 3,
  "ଚାରି": 4,
  "ପାଞ୍ଚ": 5,
  "ଛଅ": 6,
  "ସାତ": 7,
  "ଆଠ": 8,
  "ନଅ": 9,
  "ଦଶ": 10,
  "କୋଡ଼ିଏ": 20,
  "ତିରିଶ": 30,
  "ଚାଳିଶ": 40,
  "ପଚାଶ": 50,
  "ଶହ": 100,
  "ପାଞ୍ଚ ଶହ": 500,
  "ହଜାର": 1000,
  "ଲକ୍ଷ": 100000,
};

/**
 * Parses spoken number words across English, Hindi, Bengali, Kannada, Tamil, Telugu, Malayalam, Gujarati, Marathi, Punjabi, Odia
 */
function parseWordsToNumber(text: string): number | null {
  const cleaned = text
    .replace(/[^\w\s\u0900-\u0D7F]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();

  // Special Hindi / Bengali prefixes: "dedh hazaar" (1500), "dhai hazaar" (2500), "দেড় হাজার" (1500), "আড়াই হাজার" (2500)
  if (/\b(dedh|derh|डेढ़|দেড়)\s+(hazaar|hazar|hajar|thousand|हज़ार|हजार|হাজার)\b/i.test(cleaned)) {
    return 1500;
  }
  if (/\b(dhai|dhayi|ढाई|আড়াই)\s+(hazaar|hazar|hajar|thousand|हज़ार|हजार|হাজার)\b/i.test(cleaned)) {
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

      if (val >= 1000) {
        currentGroup = (currentGroup || 1) * val;
        total += currentGroup;
        currentGroup = 0;
      } else if (val === 100) {
        currentGroup = (currentGroup || 1) * val;
      } else {
        currentGroup += val;
      }
    } else if (/^\d+$/.test(token)) {
      // Inline digits like "15 sau" or "2 hazaar" or "2 ಸಾವಿರ"
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

  const raw = normalizeIndicDigits(transcript.trim());

  // 1. Check for 'k' slang: e.g. "2k", "2.5k", "5k", "10k"
  const kMatch = raw.match(/\b(\d+(?:\.\d+)?)\s*k\b/i);
  if (kMatch && kMatch[1]) {
    const val = Math.round(parseFloat(kMatch[1]) * 1000);
    if (isValidCashAmount(val)) return val;
  }

  // 2. Check for explicit currency patterns with digits: e.g. "₹2000", "2000 rupees", "2000 টাকা", "2000 రూపాయలు"
  const currencyPattern = "₹|rs\\.?|inr|rupees|rupaye|रुपये|টাকা|টাকার|taka|ரூபாய்|రూಪాయలు|ರೂಪಾಯಿ|રૂપિયા|ਰੁਪਏ|രൂപ|টকা|ଟଙ୍କা";
  const prefixRegex = new RegExp(`(?:${currencyPattern})\\s*([0-9][0-9,]*(?:\\.\\d{1,2})?)`, "i");
  const suffixRegex = new RegExp(`([0-9][0-9,]*(?:\\.\\d{1,2})?)\\s*(?:${currencyPattern}|\\/-)`, "i");
  const currencyMatch = raw.match(prefixRegex) ?? raw.match(suffixRegex);
  if (currencyMatch && currencyMatch[1]) {
    const val = Number(currencyMatch[1].replaceAll(",", ""));
    if (isValidCashAmount(val)) return val;
  }

  // 3. Check number words in English, Hindi, or Bengali: e.g. "two thousand", "five hundred", "paanch sau", "দুই হাজার"
  const wordsVal = parseWordsToNumber(raw);
  if (wordsVal !== null && isValidCashAmount(wordsVal)) {
    return wordsVal;
  }

  // 4. Fallback to bare digits in the voice transcript: e.g. "2000", "I need 1500", "send 5000", "আমার ২০০০ টাকা লাগে"
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
