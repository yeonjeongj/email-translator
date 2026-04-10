export type TargetLanguage = "KO" | "EN" | "JA" | "ZH";

const LANGUAGE_NAMES: Record<TargetLanguage, string> = {
  KO: "Korean",
  EN: "English",
  JA: "Japanese",
  ZH: "Chinese (Simplified)",
};

export async function translateEmail(
  text: string,
  targetLanguage: TargetLanguage,
  glossaryPrompt: string
): Promise<string> {
  const response = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, targetLanguage, glossaryPrompt }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error ?? `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.translation as string;
}

export { LANGUAGE_NAMES };
