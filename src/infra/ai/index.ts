import "server-only";

import OpenAI from "openai";

export const ai = new OpenAI({
  apiKey: process.env.AI_API_KEY!,
});