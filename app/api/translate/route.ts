import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const LANGUAGE_NAMES: Record<string, string> = {
  KO: "Korean",
  EN: "English",
  JA: "Japanese",
  ZH: "Chinese (Simplified)",
};

const MOCK = process.env.MOCK_TRANSLATE === "true";

export async function POST(req: NextRequest) {
  try {
    const { text, targetLanguage, glossaryPrompt } = await req.json();

    if (MOCK) {
      await new Promise((r) => setTimeout(r, 600)); // simulate latency
      return NextResponse.json({
        translation: `[MOCK ${targetLanguage}] ${text}`,
      });
    }

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing or invalid text" }, { status: 400 });
    }

    if (!targetLanguage || !LANGUAGE_NAMES[targetLanguage]) {
      return NextResponse.json({ error: "Invalid target language" }, { status: 400 });
    }

    const langName = LANGUAGE_NAMES[targetLanguage];

    const systemPrompt = `You are a professional email translator. Translate the given email text accurately and naturally into ${langName}. Preserve the original formatting, tone, and structure. Only output the translated text — no explanations or notes.${glossaryPrompt ?? ""}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `Please translate the following email into ${langName}:\n\n${text}`,
        },
      ],
      system: systemPrompt,
    });

    const translation =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({ translation });
  } catch (error) {
    console.error("Translation error:", error);
    const message = error instanceof Error ? error.message : "Translation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
