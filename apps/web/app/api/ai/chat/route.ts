import { smoothStream, streamText } from "ai";
import { v7 as uuidv7 } from "uuid";

import { models } from "@/lib/ai/models";
import { systemPrompt } from "@/lib/ai/system-prompt";
import {
  createEvent,
  createRecurringEvent,
  deleteEvent,
  getEvent,
  getEvents,
  getFreeSlots,
  getNextUpcomingEvent,
  updateEvent,
} from "@/lib/ai/tools";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  try {
    const now = new Date();
    const currentDate = now.toISOString();
    const formattedDate = now.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      weekday: "long",
      year: "numeric",
    });
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const result = streamText({
      experimental_generateMessageId: uuidv7,
      experimental_transform: smoothStream({ chunking: "word" }),
      maxSteps: 25,
      messages,
      model: models.google,
      system: systemPrompt({ currentDate, formattedDate, timezone }),
      tools: {
        createEvent,
        createRecurringEvent,
        deleteEvent,
        getEvent,
        getEvents,
        getFreeSlots,
        getNextUpcomingEvent,
        updateEvent,
      },
      onError: (error) => {
        console.error("Error while streaming:", JSON.stringify(error, null, 2));
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in chat API:", error);
    return new Response("An error occurred processing your request.", {
      status: 500,
    });
  }
}
