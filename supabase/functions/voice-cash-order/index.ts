// @ts-nocheck
export const config = { auth: false };

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SarvamClient } from "../_shared/sarvam.ts";
import { toSarvamLanguageCode } from "../_shared/constants.ts";
import { analyzeZingIntent } from "../_shared/intent.ts";
import { extractVoiceCashAmount, isValidCashAmount } from "../_shared/voiceAmountParser.ts";
import { createRequestLogger } from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const logger = createRequestLogger("voice-cash-order");

  try {
    const contentType = req.headers.get("content-type") || "";
    let audioData: Uint8Array;
    let preferredLanguage = "en";
    let mimeType = "audio/webm";
    let isDebug = false;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("audio") || formData.get("file");
      if (!file || !(file instanceof Blob)) {
        return new Response(
          JSON.stringify({ error: "Missing required audio file in form data" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const arrayBuffer = await file.arrayBuffer();
      audioData = new Uint8Array(arrayBuffer);
      mimeType = file.type || mimeType;
      const langParam = formData.get("preferred_language");
      if (typeof langParam === "string" && langParam.trim()) {
        preferredLanguage = langParam.trim();
      }
      const debugParam = formData.get("__debugEcho");
      if (debugParam === "true" || debugParam === "1") {
        isDebug = true;
      }
    } else {
      const payload = (await req.json()) as {
        audio?: string;
        preferred_language?: string;
        mime_type?: string;
        __debugEcho?: boolean;
      };

      if (payload.__debugEcho === true) {
        isDebug = true;
      }

      if (!payload.audio || typeof payload.audio !== "string") {
        return new Response(
          JSON.stringify({ error: "Missing required 'audio' base64 string in payload" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let base64 = payload.audio;
      if (base64.includes(",")) {
        const parts = base64.split(",");
        const header = parts[0];
        base64 = parts[1];
        const match = header.match(/data:([^;]+);base64/);
        if (match && match[1]) {
          mimeType = match[1];
        }
      }

      if (payload.mime_type) {
        mimeType = payload.mime_type;
      }
      if (payload.preferred_language) {
        preferredLanguage = payload.preferred_language;
      }

      const binaryStr = atob(base64);
      audioData = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        audioData[i] = binaryStr.charCodeAt(i);
      }
    }

    const sarvamLang = toSarvamLanguageCode(preferredLanguage);
    const sarvamClient = new SarvamClient();

    // Use "unknown" to allow Sarvam STT to auto-detect whichever language the user speaks
    const sttResult = await sarvamClient.speechToText({
      audio: audioData,
      languageCode: "unknown",
      mimeType,
    });

    const transcript = (sttResult.transcript || "").trim();

    // Determine detected language: prioritize explicit non-Devanagari scripts, then Sarvam STT code, then keywords
    let detectedLanguage = "en-IN";

    if (/[\u0980-\u09FF]/.test(transcript) || /\b(taka|taaka|takar|taakar|takaa|takay|poisa|poisha|lagbe|laagbe|lage|laage|chai|chayi|chaye|hajar|hazaarr|hajaar|sho|shoh|panchsho|paanchsho|pachsho|pachso|pancho|eksho|duso|tinsho|charsho|choyso|shatsho|aatsho|noyso|amar|aamar|amake|aamake|amader|dorkar|dorkaar|pathan|pathao|pathiye|deben|din|koto|korun|koro|thik|ache|acche)\b/i.test(transcript)) {
      detectedLanguage = "bn-IN";
    } else if (/[\u0C80-\u0CFF]/.test(transcript) || /\b(beku|kodi|roopayi|saavira|nooru|ainuru|kalsi|badi|kodu)\b/i.test(transcript)) {
      detectedLanguage = "kn-IN";
    } else if (/[\u0B80-\u0BFF]/.test(transcript) || /\b(venum|kudu|roobai|aayiram|nooru|anuppu|anuppunga|pannunga)\b/i.test(transcript)) {
      detectedLanguage = "ta-IN";
    } else if (/[\u0C00-\u0C7F]/.test(transcript) || /\b(kavali|ivvandi|roopayalu|veylu|vandhalu|pampandi|cheyandi)\b/i.test(transcript)) {
      detectedLanguage = "te-IN";
    } else if (/[\u0A80-\u0AFF]/.test(transcript) || /\b(joiye|aapo|rupiya|hajar|so|moklo|kari do)\b/i.test(transcript)) {
      detectedLanguage = "gu-IN";
    } else if (/[\u0A00-\u0A7F]/.test(transcript) || /\b(chahida|chahidi|rupaiye|hajaar|bhej deo|kar dio)\b/i.test(transcript)) {
      detectedLanguage = "pa-IN";
    } else if (/[\u0D00-\u0D7F]/.test(transcript) || /\b(venam|roopa|aayiram|ayakkoo|cheyyuka)\b/i.test(transcript)) {
      detectedLanguage = "ml-IN";
    } else if (/[\u0B00-\u0B7F]/.test(transcript) || /\b(darkar|tanka|hajara|pathantu|karantu)\b/i.test(transcript)) {
      detectedLanguage = "od-IN";
    } else if (/[\u0900-\u097F]/.test(transcript)) {
      // Devanagari script: check if Marathi or Hindi
      if (/\b(पाहिजे|हजार|रुपये|मला|पाठवा|करा)\b/i.test(transcript) || /\b(pahije|mala|pathva)\b/i.test(transcript)) {
        detectedLanguage = "mr-IN";
      } else {
        detectedLanguage = "hi-IN";
      }
    } else if (sttResult.languageCode && sttResult.languageCode !== "unknown" && sttResult.languageCode !== "auto") {
      detectedLanguage = toSarvamLanguageCode(sttResult.languageCode);
    } else if (/\b(chahiye|rupaye|rupay|hazaar|hazar|sau|mujhe|bhejo|karo|paanch|panch|bhej do|kar do)\b/i.test(transcript)) {
      detectedLanguage = "hi-IN";
    } else if (preferredLanguage && preferredLanguage !== "unknown" && preferredLanguage !== "auto") {
      detectedLanguage = toSarvamLanguageCode(preferredLanguage);
    }

    // 1. Initial intent analysis via shared classifier
    const analysis = analyzeZingIntent(transcript);

    // 2. Resolve amount: validate shared classifier amount (500-100k) or run voice fallback chain
    let finalAmount: number | null = null;
    const initialAmount = analysis.entities.amount?.value;
    const voiceFallbackAmount = extractVoiceCashAmount(transcript);

    if (typeof initialAmount === "number" && isValidCashAmount(initialAmount)) {
      finalAmount = initialAmount;
    } else {
      finalAmount = voiceFallbackAmount;
    }

    const finalIntent = finalAmount !== null ? "cash_order" : analysis.intent;

    const responsePayload = {
      transcript,
      intent: finalIntent,
      extractedAmount: finalAmount,
      extractedDate: analysis.entities.date?.value ?? null,
      extractedTime: analysis.entities.time ?? null,
      detectedLanguage,
      ...(isDebug
        ? {
            __debug: {
              hasApiKey: Boolean(Deno.env.get("SARVAM_API_KEY")),
              mimeType,
              preferredLanguage,
              sarvamLang,
              detectedLanguage,
              audioDataBytes: audioData?.length,
              rawSttResult: sttResult,
              transcript,
              analysis,
              voiceFallbackAmount,
              finalAmount,
              finalIntent,
            },
          }
        : {}),
    };

    logger.success();
    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.failure(error);
    const message = error instanceof Error ? error.message : "Failed to process voice cash order";
    return new Response(
      JSON.stringify({
        error: message,
        transcript: "",
        intent: "general_support",
        extractedAmount: null,
        extractedDate: null,
        extractedTime: null,
        detectedLanguage: null,
        __debug: {
          hasApiKey: Boolean(Deno.env.get("SARVAM_API_KEY")),
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
