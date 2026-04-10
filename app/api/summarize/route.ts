import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { Summary } from "@/lib/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a professional assistant specializing in communication between Korean media production teams and overseas studios.

Your task is to update an existing project summary by incorporating one new email message.

Rules:
- Return ONLY a valid JSON object. No explanation, no markdown, no additional text.
- If the existing summary is null, generate a fresh summary from the new message alone.
- Preserve accurate information from the existing summary unless the new message changes or contradicts it.
- Keep oneliner under 60 characters.
- Extract action items only if they require a concrete follow-up from our side.
- Infer status from context:
    "ongoing"  → active discussion, awaiting response, in progress
    "pending"  → waiting for a specific action before proceeding
    "done"     → explicitly confirmed, completed, or closed
- topics should reflect all subjects discussed across the entire thread, not just the new message.
- Never translate proper nouns, product names, or studio names.
- Write oneliner, actions, and topics fields in Korean.

Return this exact JSON structure:
{
  "summary": {
    "oneliner": "string",
    "actions": ["string"],
    "status": "ongoing" | "pending" | "done",
    "topics": ["string"],
    "updatedAt": "string"
  }
}`;

export async function POST(req: NextRequest) {
  try {
    const { existingSummary, originalText, translatedText, replySourceText, replyTranslatedText, companyName, threadTitle } = await req.json();

    const replySection = replySourceText?.trim() && replyTranslatedText?.trim()
      ? `\nOutbound reply (written by our side):
[Original - Korean]
${replySourceText}

[Translation]
${replyTranslatedText}`
      : "";

    const userMessage = `Company: ${companyName}
Project: ${threadTitle}

Existing summary:
${existingSummary ? JSON.stringify(existingSummary, null, 2) : "null"}

Inbound email message:
[Original]
${originalText}

[Translation]
${translatedText}
${replySection}
Today's date: ${new Date().toISOString()}`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    const parsed = JSON.parse(cleaned) as { summary: Summary };

    return NextResponse.json({ summary: parsed.summary });
  } catch (error) {
    console.error("Summarize error:", error);
    const msg = error instanceof Error ? error.message : "Summarization failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
