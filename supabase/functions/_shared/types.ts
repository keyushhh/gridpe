export type SarvamChatRole = "system" | "user" | "assistant";
export type SarvamChatModel = "sarvam-105b";

export interface SarvamChatMessage {
  role: SarvamChatRole;
  content: string;
}

export interface SarvamChatCompletionRequest {
  model: SarvamChatModel;
  messages: SarvamChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  reasoningEffort?: "none" | "low" | "medium" | "high" | null;
  wikiGrounding?: boolean;
  timeoutMs?: number;
  maxRetries?: number;
}

export interface SarvamChatCompletion {
  id: string;
  model: string;
  content: string;
  finishReason: string | null;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  requestId: string | null;
}

export interface SarvamSpeechToTextRequest {
  audio: Blob | ArrayBuffer | Uint8Array;
  fileName?: string;
  mimeType?: string;
  languageCode?: string;
  model?: string;
  prompt?: string;
  timeoutMs?: number;
  maxRetries?: number;
}

export interface SarvamSpeechToTextResponse {
  transcript: string;
  languageCode?: string;
  requestId: string | null;
}

export interface SarvamTextToSpeechRequest {
  text: string;
  languageCode?: string;
  speaker?: string;
  model?: string;
  pitch?: number;
  pace?: number;
  loudness?: number;
  speechSampleRate?: number;
  enablePreprocessing?: boolean;
  timeoutMs?: number;
  maxRetries?: number;
}

export interface SarvamTextToSpeechResponse {
  audioBase64: string;
  mimeType: string;
  requestId: string | null;
}

export interface RequestLogContext {
  requestId: string;
  operation: string;
  model?: string;
  startedAt: number;
}

export interface PromptDefinition<TVariables extends object = Record<string, string>> {
  id: string;
  version: number;
  render: (variables: TVariables) => string;
}
