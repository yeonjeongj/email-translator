import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert in formal Korean business email writing for media production teams communicating with overseas studios.

Your task: given an inbound email and an optional reply body written by the user, return the full reply text with a polite 서문 (opening) and 마무리 (closing) added.

Rules:
- Write ONLY in Korean.
- The 서문 must feel natural and contextually appropriate to the inbound email — reference the topic, acknowledge receipt, or express thanks as fitting.
- The 마무리 must close politely and professionally.
- If replyBody is provided: output = 서문 + blank line + replyBody (unchanged) + blank line + 마무리
- If replyBody is empty: output = 서문 + blank line + [본문을 작성해 주세요.] + blank line + 마무리
- Do NOT include subject line or sender/receiver names.
- Output ONLY the final composed text — no explanations.`;

export async function POST(req: NextRequest) {
  try {
    const { inboundOriginal, inboundTranslated, replyBody } = await req.json();

    if (!inboundOriginal && !inboundTranslated) {
      return NextResponse.json({ error: "Inbound email content is required" }, { status: 400 });
    }

    const userMessage = `Inbound email context:
[Original]
${inboundOriginal ?? ""}

[Korean Translation]
${inboundTranslated ?? ""}

Reply body written so far (may be empty):
${replyBody?.trim() ? replyBody.trim() : "(없음)"}

Please compose the full reply text with 서문 and 마무리.`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const result = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ result });
  } catch (error) {
    console.error("Reply formalities error:", error);
    const msg = error instanceof Error ? error.message : "Failed to generate formalities";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
