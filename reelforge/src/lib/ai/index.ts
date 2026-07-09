import type { AIProvider } from "./types";
import { MockAIProvider } from "./mock-provider";

// Provider registry. Selected via AI_PROVIDER env var so ops can flip providers
// without a code change. Add real providers here (e.g. an OpenAIProvider that
// calls Whisper + GPT) implementing the same AIProvider interface.

let cached: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cached) return cached;
  const which = (process.env.AI_PROVIDER || "mock").toLowerCase();
  switch (which) {
    case "mock":
    default:
      cached = new MockAIProvider();
      break;
    // case "openai":
    //   cached = new OpenAIProvider(process.env.OPENAI_API_KEY!);
    //   break;
  }
  return cached;
}

export * from "./types";
