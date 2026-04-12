import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { Summary } from "@/lib/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert Korean business email writer for IP product planning and production teams working with overseas studios.

Your task: draft a complete Korean reply to an inbound email, informed by the project's conversation history summary.

Rules:
- Write ONLY in Korean.
- Use formal, professional Korean (합쇼체).
- The draft must be contextually coherent — reference the inbound email's main point and the project's ongoing context from the summary.
- Include a polite 서문 (opening), a substantive body addressing the inbound email, and a 마무리 (closing).
- If summary has action items, address or acknowledge relevant ones where appropriate.
- Do NOT invent factual details not present in the inbound email or summary — leave [내용 입력] placeholders where specific information is needed.
- Output ONLY the draft email text — no explanations, no subject line.`;

export async function POST(req: NextRequest) {
  try {
    const { inboundOriginal, inboundTranslated, summary, companyName, threadTitle } = await req.json();

    if (!inboundOriginal && !inboundTranslated) {
      return NextResponse.json({ error: "Inbound email content is required" }, { status: 400 });
    }

    const summarySection = summary
      ? `Project summary (conversation history):
${JSON.stringify(summary as Summary, null, 2)}`
      : "Project summary: (없음 — 이 메일이 첫 번째 대화입니다.)";

    const userMessage = `Company: ${companyName ?? ""}
Project: ${threadTitle ?? ""}

${summarySection}

Inbound email to reply to:
[Original]
${inboundOriginal ?? ""}

[Korean Translation]
${inboundTranslated ?? ""}

Please write a complete Korean reply draft.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const draft = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ draft });
  } catch (error) {
    console.error("Draft reply error:", error);
    const msg = error instanceof Error ? error.message : "Failed to generate draft";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
