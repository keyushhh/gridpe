export type AiErrorCode =
  | "CONFIGURATION_ERROR"
  | "REQUEST_TIMEOUT"
  | "NETWORK_ERROR"
  | "UPSTREAM_ERROR"
  | "INVALID_RESPONSE"
  | "BUDGET_EXHAUSTED";

export class AiError extends Error {
  constructor(
    message: string,
    public readonly code: AiErrorCode,
    public readonly options: { cause?: unknown; status?: number; retryable?: boolean } = {},
  ) {
    super(message);
    this.name = "AiError";
  }

  get status(): number | undefined {
    return this.options.status;
  }

  get retryable(): boolean {
    return this.options.retryable ?? false;
  }
}

export const isAiError = (error: unknown): error is AiError => error instanceof AiError;
