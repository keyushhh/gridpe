export const config = { auth: false };

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SarvamClient } from "../_shared/sarvam.ts";
import { toSarvamLanguageCode } from "../_shared/constants.ts";
import { analyzeZingIntent } from "../_shared/intent.ts";
import { createRequestLogger } from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    } else {
      const payload = (await req.json()) as {
        audio?: string;
        preferred_language?: string;
        mime_type?: string;
      };

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

    const sttResult = await sarvamClient.speechToText({
      audio: audioData,
      languageCode: sarvamLang,
      mimeType,
    });

    const transcript = (sttResult.transcript || "").trim();

    // Analyze intent and extract entities using the shared classifier
    const analysis = analyzeZingIntent(transcript);

    const responsePayload = {
      transcript,
      intent: analysis.intent,
      extractedAmount: analysis.entities.amount?.value ?? null,
      extractedDate: analysis.entities.date?.value ?? null,
      extractedTime: analysis.entities.time ?? null,
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
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
