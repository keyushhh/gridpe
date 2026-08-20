export const config = { auth: false };

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SarvamClient } from "../_shared/sarvam.ts";
import { toSarvamLanguageCode } from "../_shared/constants.ts";
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

  const logger = createRequestLogger("voice-order-tts");

  try {
    const payload = (await req.json()) as {
      text?: string;
      preferred_language?: string;
      speaker?: string;
    };

    const text = typeof payload.text === "string" ? payload.text.trim() : "";
    if (!text) {
      return new Response(
        JSON.stringify({ error: "Missing required 'text' string in payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const preferredLanguage = typeof payload.preferred_language === "string" ? payload.preferred_language : "en";
    const sarvamLang = toSarvamLanguageCode(preferredLanguage);
    const sarvamClient = new SarvamClient();

    const ttsResult = await sarvamClient.textToSpeech({
      text,
      languageCode: sarvamLang,
      speaker: payload.speaker || "meera",
    });

    logger.success();
    return new Response(
      JSON.stringify({
        audioBase64: ttsResult.audioBase64,
        mimeType: ttsResult.mimeType || "audio/wav",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    logger.failure(error);
    const message = error instanceof Error ? error.message : "Failed to synthesize speech";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
