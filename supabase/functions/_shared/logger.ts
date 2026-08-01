import type { RequestLogContext } from "./types.ts";

type LogStatus = "started" | "succeeded" | "failed";

interface LogFields {
  status: LogStatus;
  latencyMs?: number;
  model?: string;
  error?: string;
  errorCode?: string;
  upstreamStatus?: number;
}

/**
 * Emits compact structured logs without request bodies, headers, or user content.
 */
export function createRequestLogger(
  operation: string,
  options: { requestId?: string; model?: string } = {},
): RequestLogContext & {
  success: () => void;
  failure: (error: unknown) => void;
} {
  const context: RequestLogContext = {
    requestId: options.requestId ?? crypto.randomUUID(),
    operation,
    model: options.model,
    startedAt: Date.now(),
  };

  const write = (fields: LogFields) => {
    console.log(JSON.stringify({
      requestId: context.requestId,
      operation: context.operation,
      model: fields.model ?? context.model,
      ...fields,
    }));
  };

  write({ status: "started" });

  return {
    ...context,
    success: () => write({ status: "succeeded", latencyMs: Date.now() - context.startedAt }),
    failure: (error) => {
      const details = error as { code?: string; status?: number } | undefined;
      write({
        status: "failed",
        latencyMs: Date.now() - context.startedAt,
        // Error messages can include upstream or user-provided values; keep logs safe by
        // recording only a stable error class and structured code.
        error: error instanceof Error ? error.name : "Unknown AI error",
        errorCode: details?.code,
        upstreamStatus: details?.status,
      });
    },
  };
}
