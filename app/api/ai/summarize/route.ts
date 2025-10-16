// app/api/ai/summarize/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { text } = await req.json();
  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });

  // TODO: wire to your AI provider (OpenAI) securely on server
  // Example (pseudo):
  // const summary = await callOpenAI({ prompt: `Summarize this text: ${text}`, ... });
  // return NextResponse.json({ summary });

  // For now return a very short naive summary
  const naive = text
    .split("\n")
    .filter(Boolean)
    .slice(0, 6)
    .join(" ")
    .slice(0, 800);

  return NextResponse.json({ summary: naive + (naive.length >= 800 ? "…" : "") });
}
