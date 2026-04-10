import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a professional assistant specializing in communication between Korean media production teams and overseas studios.

Your task is to create a milestone entry that captures the key outcome or decision from the provided email exchange.

Rules:
- Return ONLY a valid JSON object. No explanation, no markdown, no additional text.
- title: short label under 30 characters.
- content: 1–2 sentence summary of the key outcome, decision, or agreement in this email.
- Never translate proper nouns, product names, or studio names.
- Write title and content in Korean.

Return this exact JSON structure:
{
  "title": "string",
  "content": "string"
}`;

export async function POST(req: NextRequest) {
  try {
    const { originalText, translatedText, replySourceText, replyTranslatedText, companyName, threadTitle } = await req.json();

    const replySection = replySourceText?.trim() && replyTranslatedText?.trim()
      ? `\nOutbound reply (written by our side):
[Original - Korean]
${replySourceText}

[Translation]
${replyTranslatedText}`
      : "";

    const userMessage = `Company: ${companyName}
Project: ${threadTitle}

Inbound email message:
[Original]
${originalText}

[Translation]
${translatedText}
${replySection}`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    const parsed = JSON.parse(cleaned) as { title: string; content: string };

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Milestone generation error:", error);
    const msg = error instanceof Error ? error.message : "Milestone generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
