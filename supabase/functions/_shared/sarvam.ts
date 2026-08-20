import {
  SARVAM_API_BASE_URL,
  SARVAM_API_KEY_ENV,
  SARVAM_DEFAULT_MAX_RETRIES,
  SARVAM_DEFAULT_TIMEOUT_MS,
  SARVAM_RETRY_BASE_DELAY_MS,
  toSarvamLanguageCode,
} from "./constants.ts";
import { AiError } from "./errors.ts";
import type {
  SarvamChatCompletion,
  SarvamChatCompletionRequest,
  SarvamSpeechToTextRequest,
  SarvamSpeechToTextResponse,
} from "./types.ts";

const isRetryableStatus = (status: number) => status === 408 || status === 429 || status >= 500;
const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export interface SarvamClientOptions {
  baseUrl?: string;
  apiKey?: string;
  fetcher?: typeof fetch;
}

interface JsonRequestOptions {
  body: unknown;
  timeoutMs?: number;
  maxRetries?: number;
  validate: (payload: unknown) => boolean;
}

interface JsonResponse<T> {
  data: T;
  status: number;
  requestId: string | null;
}

interface SarvamChatApiResponse {
  id: string;
  model: string;
  choices: [{
    finish_reason: string | null;
    message: { content: string };
  }, ...Array<{
    finish_reason: string | null;
    message: { content: string };
  }>];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

/** Minimal Deno-compatible REST client shared by all Sarvam integrations. */
export class SarvamClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly fetcher: typeof fetch;

  constructor(options: SarvamClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? SARVAM_API_BASE_URL).replace(/\/$/, "");
    const denoEnv = (globalThis as any).Deno?.env;
    this.apiKey = options.apiKey ?? (denoEnv ? denoEnv.get(SARVAM_API_KEY_ENV) : "") ?? "";
    this.fetcher = options.fetcher ?? fetch;

    if (!this.apiKey) {
      throw new AiError(`Missing required ${SARVAM_API_KEY_ENV} environment variable`, "CONFIGURATION_ERROR");
    }
  }

  async chatCompletion(request: SarvamChatCompletionRequest): Promise<SarvamChatCompletion> {
    const reasoningEffortValue = request.reasoningEffort === "none" || request.reasoningEffort === null
      ? null
      : request.reasoningEffort;

    const body = {
      model: request.model,
      messages: request.messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      top_p: request.topP,
      reasoning_effort: reasoningEffortValue,
      wiki_grounding: request.wikiGrounding,
    };
    console.log("[Sarvam Payload Debug]:", JSON.stringify(body));
    const response = await this.request<Record<string, any>>("/v1/chat/completions", {
      body,
      timeoutMs: request.timeoutMs,
      maxRetries: request.maxRetries,
      validate: isChatCompletionResponse,
    });

    const data = response.data;
    const choice = data.choices?.[0] || {};
    const messageContent = choice.message?.content;
    const finishReason = choice.finish_reason ?? choice.finishReason ?? null;

    if ((messageContent === null || messageContent === undefined || messageContent === "") && finishReason === "length") {
      throw new AiError("Sarvam completion token budget was exhausted before generating output content.", "BUDGET_EXHAUSTED", {
        status: response.status,
      });
    }

    if (typeof messageContent !== "string") {
      throw new AiError("Sarvam response did not include a valid message.content string.", "INVALID_RESPONSE");
    }

    return {
      id: typeof data.id === "string" ? data.id : "",
      model: typeof data.model === "string" ? data.model : request.model,
      content: messageContent,
      finishReason,
      usage: data.usage && {
        promptTokens: data.usage.prompt_tokens ?? data.usage.promptTokens,
        completionTokens: data.usage.completion_tokens ?? data.usage.completionTokens,
        totalTokens: data.usage.total_tokens ?? data.usage.totalTokens,
      },
      requestId: response.requestId,
    };
  }

  async speechToText(
    audioOrRequest: Blob | ArrayBuffer | Uint8Array | SarvamSpeechToTextRequest,
    languageCode?: string,
  ): Promise<SarvamSpeechToTextResponse> {
    const isRequestObj = audioOrRequest && typeof audioOrRequest === "object" && "audio" in audioOrRequest;
    const req: SarvamSpeechToTextRequest = isRequestObj
      ? (audioOrRequest as SarvamSpeechToTextRequest)
      : {
          audio: audioOrRequest as (Blob | ArrayBuffer | Uint8Array),
          languageCode,
        };

    const targetLang = toSarvamLanguageCode(req.languageCode);
    const formData = new FormData();

    let fileBlob: Blob;
    if (req.audio instanceof Blob) {
      fileBlob = req.audio;
    } else {
      fileBlob = new Blob([req.audio as any], { type: req.mimeType || "audio/webm" });
    }

    const fileName = req.fileName || (fileBlob.type.includes("wav") ? "audio.wav" : fileBlob.type.includes("mp4") ? "audio.mp4" : "audio.webm");
    formData.append("file", fileBlob, fileName);

    if (targetLang) {
      formData.append("language_code", targetLang);
    }
    if (req.model) {
      formData.append("model", req.model);
    }
    if (req.prompt) {
      formData.append("prompt", req.prompt);
    }

    const response = await this.requestFormData<Record<string, any>>("/speech-to-text", formData, {
      timeoutMs: req.timeoutMs,
      maxRetries: req.maxRetries,
      validate: isSpeechToTextResponse,
    });

    const data = response.data;
    const transcript = typeof data.transcript === "string" ? data.transcript : "";

    return {
      transcript,
      languageCode: typeof data.language_code === "string" ? data.language_code : targetLang,
      requestId: response.requestId,
    };
  }

  private async request<T>(path: string, options: JsonRequestOptions): Promise<JsonResponse<T>> {
    const maxRetries = options.maxRetries ?? SARVAM_DEFAULT_MAX_RETRIES;
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        const response = await this.fetchWithTimeout(path, options);
        if (!response.ok) {
          const errText = await response.text().catch(() => "");
          console.error(`[Sarvam Upstream Error ${response.status}]:`, errText);
          const error = new AiError(
            `Sarvam request failed with status ${response.status}`,
            "UPSTREAM_ERROR",
            { status: response.status, retryable: isRetryableStatus(response.status) },
          );
          if (error.retryable && attempt < maxRetries) {
            await delay(SARVAM_RETRY_BASE_DELAY_MS * 2 ** attempt);
            continue;
          }
          throw error;
        }

        const data = await parseJson(response);
        if (!options.validate(data)) {
          throw new AiError("Sarvam response did not match the expected schema.", "INVALID_RESPONSE");
        }
        return { data: data as T, status: response.status, requestId: response.headers.get("x-request-id") };
      } catch (error) {
        const aiError = toAiError(error);
        if (aiError.retryable && attempt < maxRetries) {
          await delay(SARVAM_RETRY_BASE_DELAY_MS * 2 ** attempt);
          continue;
        }
        throw aiError;
      }
    }
    throw new AiError("Sarvam request retries exhausted.", "UPSTREAM_ERROR");
  }

  private async requestFormData<T>(
    path: string,
    formData: FormData,
    options: { timeoutMs?: number; maxRetries?: number; validate: (payload: unknown) => boolean },
  ): Promise<JsonResponse<T>> {
    const maxRetries = options.maxRetries ?? SARVAM_DEFAULT_MAX_RETRIES;
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        const response = await this.fetchFormDataWithTimeout(path, formData, options.timeoutMs);
        if (!response.ok) {
          const errText = await response.text().catch(() => "");
          console.error(`[Sarvam STT Upstream Error ${response.status}]:`, errText);
          const error = new AiError(
            `Sarvam STT request failed with status ${response.status}`,
            "UPSTREAM_ERROR",
            { status: response.status, retryable: isRetryableStatus(response.status) },
          );
          if (error.retryable && attempt < maxRetries) {
            await delay(SARVAM_RETRY_BASE_DELAY_MS * 2 ** attempt);
            continue;
          }
          throw error;
        }

        const data = await parseJson(response);
        if (!options.validate(data)) {
          throw new AiError("Sarvam STT response did not match the expected schema.", "INVALID_RESPONSE");
        }
        return { data: data as T, status: response.status, requestId: response.headers.get("x-request-id") };
      } catch (error) {
        const aiError = toAiError(error);
        if (aiError.retryable && attempt < maxRetries) {
          await delay(SARVAM_RETRY_BASE_DELAY_MS * 2 ** attempt);
          continue;
        }
        throw aiError;
      }
    }
    throw new AiError("Sarvam STT request retries exhausted.", "UPSTREAM_ERROR");
  }

  private async fetchWithTimeout(path: string, options: JsonRequestOptions): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? SARVAM_DEFAULT_TIMEOUT_MS);
    try {
      const headers = new Headers();
      // The client owns these headers so callers cannot accidentally send a different
      // credential or content type.
      headers.set("api-subscription-key", this.apiKey);
      headers.set("content-type", "application/json");
      return await this.fetcher(`${this.baseUrl}${path}`, {
        method: "POST",
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private async fetchFormDataWithTimeout(path: string, formData: FormData, timeoutMs?: number): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs ?? SARVAM_DEFAULT_TIMEOUT_MS);
    try {
      const headers = new Headers();
      headers.set("api-subscription-key", this.apiKey);
      return await this.fetcher(`${this.baseUrl}${path}`, {
        method: "POST",
        headers,
        body: formData,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}

function isSpeechToTextResponse(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const res = payload as Record<string, unknown>;
  return typeof res.transcript === "string";
}

function isChatCompletionResponse(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const response = payload as Record<string, unknown>;
  // Sarvam OpenAI-compatible format returns choices array with either message.content or text
  if (!Array.isArray(response.choices) || response.choices.length === 0) return false;
  const firstChoice = response.choices[0];
  if (!firstChoice || typeof firstChoice !== "object") return false;

  const message = (firstChoice as Record<string, unknown>).message;
  const hasMessageContent = Boolean(message && typeof message === "object" && typeof (message as Record<string, unknown>).content === "string");
  const hasTextContent = typeof (firstChoice as Record<string, unknown>).text === "string";
  const hasDirectContent = typeof response.content === "string";

  return Boolean(hasMessageContent || hasTextContent || hasDirectContent);
}

async function parseJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new AiError("Sarvam returned a non-JSON response.", "INVALID_RESPONSE", { status: response.status });
  }
  try {
    const json = await response.json();
    console.log("[Sarvam Raw Response]:", JSON.stringify(json));
    return json;
  } catch (cause) {
    throw new AiError("Sarvam returned invalid JSON.", "INVALID_RESPONSE", { cause, status: response.status });
  }
}

function toAiError(error: unknown): AiError {
  if (error instanceof AiError) return error;
  if (error instanceof DOMException && error.name === "AbortError") {
    return new AiError("Sarvam request timed out.", "REQUEST_TIMEOUT", { cause: error, retryable: true });
  }
  return new AiError("Unable to reach Sarvam.", "NETWORK_ERROR", { cause: error, retryable: true });
}
