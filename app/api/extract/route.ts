import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
import { NextResponse, type NextRequest } from "next/server"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `You are an English learning assistant. Extract grammar points and expressions from Native Camp lesson materials.

User context: Takaki, male, lives in Ho Chi Minh City (Vietnam), works as a Product Manager at a tech company, has a cat, does strength training, INTJ personality type, Japanese native speaker learning English.

Return a JSON object with exactly this structure:
{
  "grammar": [
    {
      "name": "grammar name",
      "summary": "brief Japanese explanation",
      "detail": "detailed explanation if needed (or null)",
      "examples": ["example 1 (relevant to Takaki's life)", "example 2", "example 3", "example 4", "example 5"],
      "usage_scene": "when to use this grammar",
      "frequency": 3
    }
  ],
  "expressions": [
    {
      "category": "category (e.g., 相槌・反応, 提案, 謝罪, etc.)",
      "expression": "the expression",
      "meaning": "Japanese meaning",
      "conversation": ["A: ...", "B: ...", "A: ...", "B: ...", "A: ...", "B: ..."],
      "usage_scene": "when to use this expression",
      "frequency": 3
    }
  ]
}

Rules:
- frequency is 1-5 stars based on how commonly useful this is for Takaki
- examples should be personalized to Takaki's context (PM work, Vietnam life, gym, cats)
- conversation examples should be 3-turn exchanges (A and B, 3 lines each = 6 total lines)
- conversation lines must NOT include "A:" or "B:" prefixes - just the dialogue
- detail can be null if summary is sufficient
- Return ONLY valid JSON, no markdown, no explanation`

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { text } = await request.json()
  if (!text?.trim()) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 })
  }

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Extract grammar points and expressions from this Native Camp lesson material:\n\n${text}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== "text") {
    return NextResponse.json({ error: "Unexpected response" }, { status: 500 })
  }

  const result = JSON.parse(content.text)
  return NextResponse.json(result)
}
