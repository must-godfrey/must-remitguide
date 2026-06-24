import OpenAI from "openai";

let client;

// Lazy init so the module can be imported without a key present
// (e.g. during tooling/tests). The key is only required at call time.
export function getClient() {
  if (!client) {
    const apiKey = process.env.QWEN_API_KEY;
    if (!apiKey) {
      throw new Error("QWEN_API_KEY is not set. Copy .env.example to .env and add your key.");
    }
    client = new OpenAI({
      apiKey,
      baseURL: process.env.QWEN_BASE_URL || "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    });
  }
  return client;
}

export const MODEL = () => process.env.QWEN_MODEL || "qwen-plus";
