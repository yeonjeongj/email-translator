export interface GlossaryEntry {
  source: string;
  target: string;
}

const STORAGE_KEY = "email-translator-glossary";

export function loadGlossary(): GlossaryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveGlossary(entries: GlossaryEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function addEntry(
  entries: GlossaryEntry[],
  entry: GlossaryEntry
): GlossaryEntry[] {
  const updated = [...entries, entry];
  saveGlossary(updated);
  return updated;
}

export function removeEntry(
  entries: GlossaryEntry[],
  index: number
): GlossaryEntry[] {
  const updated = entries.filter((_, i) => i !== index);
  saveGlossary(updated);
  return updated;
}

export function buildGlossaryPrompt(entries: GlossaryEntry[]): string {
  if (entries.length === 0) return "";
  const lines = entries
    .map((e) => `  - "${e.source}" → "${e.target}"`)
    .join("\n");
  return `\nUse the following glossary when translating (these terms must be translated exactly as specified):\n${lines}\n`;
}
