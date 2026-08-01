import type { PromptDefinition } from "./types.ts";

/**
 * Declares a versioned prompt without coupling prompt content to an edge function.
 * Prompt definitions will be added in later sprints.
 */
export function definePrompt<TVariables extends object>(
  definition: PromptDefinition<TVariables>,
): PromptDefinition<TVariables> {
  return definition;
}
