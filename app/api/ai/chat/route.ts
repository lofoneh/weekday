import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { smoothStream, streamText } from "ai";
import { v7 as uuidv7 } from "uuid";

import { env } from "@/env";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  try {
    const openrouter = createOpenRouter({
      apiKey: env.OPENROUTER_API_KEY,
    });

    const result = await streamText({
      experimental_generateMessageId: uuidv7,
      experimental_transform: smoothStream({ chunking: "word" }),
      maxSteps: 25,
      messages,
      model: openrouter.chat("google/gemini-2.5-flash-preview"),
      system: "You are a helpful assistant.",
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in chat API:", error);
    return new Response("An error occurred processing your request.", {
      status: 500,
    });
  }
}
