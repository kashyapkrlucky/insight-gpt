
import OpenAI from "openai";
import { OpenAIResponseError } from "@/server/errors";

function readNumberEnv(names: readonly string[], fallback: number): number {
  const value = names.map((name) => process.env[name]).find(Boolean);
  if (!value) return fallback;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const AI_CONFIG = {
  apiKey: process.env.AI_API_KEY,
  maxOutputTokens: readNumberEnv(
    ["AI_MAX_OUTPUT_TOKENS", "AI_MAX_COMPLETION_TOKENS"],
    1_000,
  ),
  model: process.env.AI_MODEL || "gpt-4o-mini",
  temperature: readNumberEnv(["AI_TEMPERATURE"], 0.3),
} as const;

let cachedOpenAIClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!AI_CONFIG.apiKey) {
    throw new OpenAIResponseError(
      "OpenAI API key is missing. Add AI_API_KEY to .env.local and restart the dev server.",
    );
  }

  cachedOpenAIClient ??= new OpenAI({
    apiKey: AI_CONFIG.apiKey,
  });

  return cachedOpenAIClient;
}
