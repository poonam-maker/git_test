import type { AIProvider } from "./types";
import { MockAIProvider } from "./mock-provider";
import { ClaudeAIProvider } from "./claude-provider";

// Provider registry. Selected via AI_PROVIDER env var so ops can flip providers
// without a code change. The `claude` provider uses Claude for clip selection
// and copy, and OpenAI Whisper for transcription; `mock` runs fully offline.

let cached: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cached) return cached;
  const which = (process.env.AI_PROVIDER || "mock").toLowerCase();
  switch (which) {
    case "claude":
    case "anthropic":
      cached = new ClaudeAIProvider();
      break;
    case "mock":
    default:
      cached = new MockAIProvider();
      break;
  }
  return cached;
}

export * from "./types";
