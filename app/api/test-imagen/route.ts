import { NextResponse } from "next/server"

export async function GET() {
  const apiKey = process.env.GOOGLE_IMAGEN_API_KEY
  if (!apiKey) return NextResponse.json({ error: "GOOGLE_IMAGEN_API_KEY not configured" }, { status: 500 })

  // 1. List available models
  const listRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=100`
  )
  const listData = await listRes.json()
  const models: string[] = (listData.models ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((m: any) => m.name as string)
    .filter((name: string) => name.includes("flash") || name.includes("imagen"))

  // 2. Try candidate models for image generation
  const candidates = [
    "gemini-2.0-flash-preview-image-generation",
    "gemini-2.0-flash",
    "gemini-2.0-flash-001",
    "gemini-2.0-flash-exp",
  ]

  const testResults: Record<string, unknown> = {}
  for (const model of candidates) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Generate a small image of a red apple" }] }],
          generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
        }),
      }
    )
    const text = await res.text()
    let parsed: unknown
    try { parsed = JSON.parse(text) } catch { parsed = null }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts = (parsed as any)?.candidates?.[0]?.content?.parts ?? []
    testResults[model] = {
      status: res.status,
      hasImage: parts.some((p: { inlineData?: unknown }) => p.inlineData),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error: (parsed as any)?.error?.message ?? null,
    }
  }

  return NextResponse.json({ availableFlashModels: models, testResults })
}
