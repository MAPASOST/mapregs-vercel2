import { put, list } from '@vercel/blob'

// Each question is stored as its own tiny blob; the question text and
// timestamp are encoded in the pathname so stats can be computed from a
// single list() scan with no per-blob fetches and no write races.
//
// Pathname format: q/<timestamp>.<rand>.<base64url(question)>.txt
const PREFIX = 'q/'
const SCAN_CAP = 5000

export interface RecentQuestion {
  question: string
  ts: number
}

export interface TopQuestion {
  question: string
  count: number
}

export interface QuestionStats {
  top: TopQuestion[]
  recent: RecentQuestion[]
  total: number
  capped: boolean
}

// Collapse near-duplicate phrasings so counts aggregate sensibly
export function normalizeQuestion(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[?!.]+$/, '')
}

export function isAnalyticsConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

export async function logQuestion(question: string): Promise<void> {
  if (!isAnalyticsConfigured()) return
  try {
    const text = question.trim().slice(0, 300)
    if (!text) return
    const encoded = Buffer.from(text).toString('base64url')
    const rand = Math.random().toString(36).slice(2, 6)
    await put(`${PREFIX}${Date.now()}.${rand}.${encoded}.txt`, text, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'text/plain',
    })
  } catch (err) {
    console.error('analytics: failed to log question', err)
  }
}

function parsePathname(pathname: string): RecentQuestion | null {
  if (!pathname.startsWith(PREFIX) || !pathname.endsWith('.txt')) return null
  const parts = pathname.slice(PREFIX.length, -4).split('.')
  if (parts.length !== 3) return null
  const ts = Number(parts[0])
  if (!Number.isFinite(ts)) return null
  try {
    const question = Buffer.from(parts[2], 'base64url').toString('utf8')
    return question ? { question, ts } : null
  } catch {
    return null
  }
}

export async function getQuestionStats(topLimit = 50, recentLimit = 100): Promise<QuestionStats> {
  if (!isAnalyticsConfigured()) {
    return { top: [], recent: [], total: 0, capped: false }
  }

  const entries: RecentQuestion[] = []
  let cursor: string | undefined
  let capped = false

  do {
    const res = await list({ prefix: PREFIX, limit: 1000, cursor })
    for (const blob of res.blobs) {
      const entry = parsePathname(blob.pathname)
      if (entry) entries.push(entry)
    }
    cursor = res.cursor
    if (entries.length >= SCAN_CAP) {
      capped = Boolean(cursor)
      break
    }
  } while (cursor)

  const counts = new Map<string, TopQuestion>()
  for (const entry of entries) {
    const norm = normalizeQuestion(entry.question)
    const existing = counts.get(norm)
    if (existing) {
      existing.count += 1
    } else {
      counts.set(norm, { question: entry.question, count: 1 })
    }
  }

  const top = [...counts.values()].sort((a, b) => b.count - a.count).slice(0, topLimit)
  const recent = [...entries].sort((a, b) => b.ts - a.ts).slice(0, recentLimit)

  return { top, recent, total: entries.length, capped }
}
