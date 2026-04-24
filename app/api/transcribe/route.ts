import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const audio = formData.get("audio") as File | null;

  if (!audio) {
    return NextResponse.json({ error: "No audio file" }, { status: 400 });
  }

  // TODO: openai → anthropic 移行が必要
  // openai.audio.transcriptions.create (Whisper) に相当する音声文字起こしAPIはAnthropicに存在しない
  // const transcription = await openai.audio.transcriptions.create({
  //   file: audio,
  //   model: "whisper-1",
  //   language: "en",
  // });
  // return NextResponse.json({ text: transcription.text });
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
