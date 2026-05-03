import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export const maxDuration = 60;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const EXTRACT_LESSONS_SCHEMA = {
  type: "object" as const,
  properties: {
    lessons: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          lesson_no: {
            type: "string" as const,
            description: 'The "L-N" identifier, e.g., "1-1", "2-15".',
          },
          topic: {
            type: "string" as const,
            description: "The lesson title text, trimmed.",
          },
        },
        required: ["lesson_no", "topic"],
      },
    },
  },
  required: ["lessons"],
};

const SYSTEM_PROMPT = `You parse Native Camp English lesson lists. The user pastes a raw list of lessons (often copy/pasted from a learning dashboard). Extract { lesson_no, topic } pairs in input order.

Format conventions you must handle:
- "1-1: Our experience"
- " 1-7: Assessment" (leading whitespace)
- "Lessons 1-7: Assessment" (with "Lessons " prefix — strip it)
- "1-1    Quantity of objects (counting noun)" (tab/space separated)

Rules:
- lesson_no is the "L-N" identifier, extracted exactly as it appears (e.g., "1-1", "1-10", "2-15"). Do NOT add a level prefix; do NOT change numbers.
- topic is the lesson title text only, trimmed. Drop trailing ":" or whitespace. Do NOT include the lesson_no, "Lessons " prefix, or any date/time.
- SKIP these lines entirely (never output them):
  * Pure dates/timestamps (e.g., "2026-04-24 16:53")
  * Section headers like "Level 1", "Level 2"
  * Notes starting with "※"
  * Empty lines
- Each lesson line produces exactly one output item. Do NOT merge or split.
- Preserve input order.
- Return ONLY via the tool. No prose.`;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { text } = (await request.json()) as { text?: string };
  if (!text?.trim()) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [
      {
        name: "save_lessons",
        description:
          "Save the extracted lesson master list (lesson_no + topic pairs).",
        input_schema: EXTRACT_LESSONS_SCHEMA,
      },
    ],
    tool_choice: { type: "tool", name: "save_lessons" },
    messages: [
      {
        role: "user",
        content: `Extract the lesson list from the following pasted text:\n\n${text}`,
      },
    ],
  });

  if (message.stop_reason === "max_tokens") {
    console.error("[extract-lessons] hit max_tokens", { usage: message.usage });
    return NextResponse.json(
      { error: "Output truncated; try fewer items at once" },
      { status: 500 },
    );
  }

  const toolUse = message.content.find((c) => c.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    console.error("[extract-lessons] no tool_use block", {
      stopReason: message.stop_reason,
      contentTypes: message.content.map((c) => c.type),
    });
    return NextResponse.json(
      { error: "Unexpected response shape" },
      { status: 500 },
    );
  }

  return NextResponse.json(toolUse.input);
}
