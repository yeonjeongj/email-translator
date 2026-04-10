import type { Company, Thread, Message, Milestone, Summary, GlossaryItem } from './types'

const MAX_MESSAGES = 10

const KEYS = {
  companies: 'mtrans:companies',
  threads:   'mtrans:threads',
  glossary:  'mtrans:glossary',
  lastSave:  'mtrans:lastSave',
} as const

// ── helpers ──────────────────────────────

function load<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(key)
  if (!raw) return []
  try {
    return JSON.parse(raw) as T[]
  } catch {
    return []
  }
}

function persist<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

// ── Company ──────────────────────────────

export function getCompanies(): Company[] {
  return load<Company>(KEYS.companies)
}

export function saveCompany(company: Company): void {
  const companies = getCompanies()
  persist(KEYS.companies, [...companies, company])
}

export function updateCompany(id: string, patch: Partial<Company>): void {
  const companies = getCompanies().map(c =>
    c.id === id ? { ...c, ...patch } : c
  )
  persist(KEYS.companies, companies)
}

export function deleteCompany(id: string): void {
  persist(KEYS.companies, getCompanies().filter(c => c.id !== id))
  persist(KEYS.threads, getThreads().filter(t => t.companyId !== id))
}

// ── Thread ───────────────────────────────

export function getThreads(): Thread[] {
  return load<Thread>(KEYS.threads)
}

export function getThreadsByCompany(companyId: string): Thread[] {
  return getThreads().filter(t => t.companyId === companyId)
}

export function saveThread(thread: Thread): void {
  const threads = getThreads()
  persist(KEYS.threads, [...threads, thread])
}

export function updateThread(id: string, patch: Partial<Thread>): void {
  const threads = getThreads().map(t =>
    t.id === id ? { ...t, ...patch } : t
  )
  persist(KEYS.threads, threads)
}

export function addMessageToThread(threadId: string, message: Message): void {
  const threads = getThreads().map(t => {
    if (t.id !== threadId) return t
    const updated = [...t.messages, message]
    return { ...t, messages: updated.slice(-MAX_MESSAGES) }
  })
  persist(KEYS.threads, threads)
}

export function addMilestone(threadId: string, milestone: Milestone): void {
  const threads = getThreads().map(t =>
    t.id === threadId
      ? { ...t, milestones: [...(t.milestones ?? []), milestone] }
      : t
  )
  persist(KEYS.threads, threads)
}

export function getMilestones(threadId: string): Milestone[] {
  return getThreads().find(t => t.id === threadId)?.milestones ?? []
}

export function updateSummary(threadId: string, summary: Summary): void {
  const threads = getThreads().map(t =>
    t.id === threadId ? { ...t, summary } : t
  )
  persist(KEYS.threads, threads)
}

// ── Glossary ─────────────────────────────

export function getGlossary(): GlossaryItem[] {
  return load<GlossaryItem>(KEYS.glossary)
}

export function saveGlossaryItem(item: GlossaryItem): void {
  const glossary = getGlossary()
  persist(KEYS.glossary, [...glossary, item])
}

export function deleteGlossaryItem(id: string): void {
  persist(KEYS.glossary, getGlossary().filter(g => g.id !== id))
}

// ── Last save state ──────────────────────

export function getLastSave(): { companyId: string; threadId: string } | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(KEYS.lastSave)
  if (!raw) return null

  let parsed: { companyId: string; threadId: string }
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  const companyExists = getCompanies().some(c => c.id === parsed.companyId)
  const threadExists  = getThreads().some(t => t.id === parsed.threadId)

  if (!companyExists || !threadExists) return null
  return parsed
}

export function setLastSave(companyId: string, threadId: string): void {
  localStorage.setItem(KEYS.lastSave, JSON.stringify({ companyId, threadId }))
}
