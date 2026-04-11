import { createClient } from './supabase/client'
import type { Company, Thread, Message, Milestone, Summary, GlossaryItem } from './types'

// ── Mappers ──────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToCompany(row: Record<string, any>): Company {
  return {
    id: row.id,
    name: row.name,
    defaultLang: row.default_lang,
    createdAt: row.created_at,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToMessage(row: Record<string, any>): Message {
  return {
    id: row.id,
    direction: row.direction,
    originalText: row.original_text,
    translatedText: row.translated_text,
    lang: row.lang,
    createdAt: row.created_at,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToMilestone(row: Record<string, any>): Milestone {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToThread(row: Record<string, any>): Thread {
  const messages = ((row.messages as Record<string, any>[]) ?? [])
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .slice(-10)
    .map(dbToMessage)
  const milestones = ((row.milestones as Record<string, any>[]) ?? [])
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map(dbToMilestone)
  return {
    id: row.id,
    companyId: row.company_id,
    title: row.title,
    summary: (row.summary as Summary) ?? null,
    messages,
    milestones,
    createdAt: row.created_at,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToGlossaryItem(row: Record<string, any>): GlossaryItem {
  return {
    id: row.id,
    source: row.source,
    target: row.target,
  }
}

// ── Helpers ──────────────────────────────────────

async function getUserId(): Promise<string> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user.id
}

// ── Company ──────────────────────────────────────

export async function getCompanies(): Promise<Company[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: true })
  return (data ?? []).map(dbToCompany)
}

export async function saveCompany(company: Company): Promise<Company> {
  const supabase = createClient()
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('companies')
    .insert({
      id: company.id,
      user_id: userId,
      name: company.name,
      default_lang: company.defaultLang,
      created_at: company.createdAt,
    })
    .select()
    .single()
  if (error) throw error
  return dbToCompany(data)
}

export async function deleteCompany(id: string): Promise<void> {
  const supabase = createClient()
  // CASCADE on threads → messages/milestones handles cleanup automatically
  await supabase.from('companies').delete().eq('id', id)
}

// ── Thread ───────────────────────────────────────

export async function getThreadsByCompany(companyId: string): Promise<Thread[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('threads')
    .select('*, messages(*), milestones(*)')
    .eq('company_id', companyId)
    .order('created_at', { ascending: true })
  return (data ?? []).map(dbToThread)
}

export async function getThread(threadId: string): Promise<Thread | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('threads')
    .select('*, messages(*), milestones(*)')
    .eq('id', threadId)
    .single()
  if (!data) return null
  return dbToThread(data)
}

// Returns { companyId: threadCount } for the sidebar in history page
export async function getThreadCounts(): Promise<Record<string, number>> {
  const supabase = createClient()
  const { data } = await supabase.rpc('get_thread_counts')
  if (!data) return {}
  return (data as { company_id: string; count: number }[]).reduce((acc, row) => {
    acc[row.company_id] = Number(row.count)
    return acc
  }, {} as Record<string, number>)
}

export async function saveThread(thread: Thread): Promise<Thread> {
  const supabase = createClient()
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('threads')
    .insert({
      id: thread.id,
      user_id: userId,
      company_id: thread.companyId,
      title: thread.title,
      summary: thread.summary,
      created_at: thread.createdAt,
    })
    .select()
    .single()
  if (error) throw error
  return dbToThread({ ...data, messages: [], milestones: [] })
}

export async function addMessageToThread(threadId: string, message: Message): Promise<void> {
  const supabase = createClient()
  const userId = await getUserId()

  await supabase.from('messages').insert({
    id: message.id,
    user_id: userId,
    thread_id: threadId,
    direction: message.direction,
    original_text: message.originalText,
    translated_text: message.translatedText,
    lang: message.lang,
    created_at: message.createdAt,
  })
  // Cap is enforced atomically by the `trg_enforce_message_cap` database trigger.
}

export async function addMilestone(threadId: string, milestone: Milestone): Promise<void> {
  const supabase = createClient()
  const userId = await getUserId()
  await supabase.from('milestones').insert({
    id: milestone.id,
    user_id: userId,
    thread_id: threadId,
    title: milestone.title,
    content: milestone.content,
    created_at: milestone.createdAt,
  })
}

export async function updateSummary(threadId: string, summary: Summary): Promise<void> {
  const supabase = createClient()
  await supabase.from('threads').update({ summary }).eq('id', threadId)
}

// ── Glossary ─────────────────────────────────────

export async function getGlossary(): Promise<GlossaryItem[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('glossary_items')
    .select('*')
    .order('created_at', { ascending: true })
  return (data ?? []).map(dbToGlossaryItem)
}

export async function saveGlossaryItem(item: GlossaryItem): Promise<GlossaryItem> {
  const supabase = createClient()
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('glossary_items')
    .insert({ id: item.id, user_id: userId, source: item.source, target: item.target })
    .select()
    .single()
  if (error) throw error
  return dbToGlossaryItem(data)
}

export async function deleteGlossaryItem(id: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('glossary_items').delete().eq('id', id)
}

// ── Last save state ──────────────────────────────

export async function getLastSave(): Promise<{ companyId: string; threadId: string } | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('user_profiles')
    .select('last_company_id, last_thread_id')
    .maybeSingle()
  if (!data?.last_company_id || !data?.last_thread_id) return null
  return { companyId: data.last_company_id, threadId: data.last_thread_id }
}

export async function setLastSave(companyId: string, threadId: string): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('user_profiles')
    .update({ last_company_id: companyId, last_thread_id: threadId })
    .eq('user_id', user.id)
}
