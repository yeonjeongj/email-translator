import type { GlossaryItem } from './types'

export function buildGlossaryPrompt(entries: GlossaryItem[]): string {
  if (entries.length === 0) return ''
  const lines = entries
    .map((e) => `  - "${e.source}" → "${e.target}"`)
    .join('\n')
  return `\nUse the following glossary when translating (these terms must be translated exactly as specified):\n${lines}\n`
}
