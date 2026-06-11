import { kv } from './kv'

const COUNTS_KEY = 'analytics:question-counts'
const RECENT_KEY = 'analytics:recent-questions'
const TOTAL_KEY = 'analytics:total-questions'
const RECENT_LIMIT = 500

export interface RecentQuestion {
  question: string
  ts: number
}

export interface TopQuestion {
  question: string
  count: number
}

// Collapse near-duplicate phrasings so counts aggregate sensibly
export function normalizeQuestion(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[?!.]+$/, '').slice(0, 200)
}

export async function logQuestion(question: string): Promise<void> {
  if (!kv) return
  try {
    const entry: RecentQuestion = { question: question.trim().slice(0, 500), ts: Date.now() }
    await Promise.all([
      kv.zincrby(COUNTS_KEY, 1, normalizeQuestion(question)),
      kv.lpush(RECENT_KEY, JSON.stringify(entry)),
      kv.incr(TOTAL_KEY),
    ])
    await kv.ltrim(RECENT_KEY, 0, RECENT_LIMIT - 1)
  } catch (err) {
    console.error('analytics: failed to log question', err)
  }
}

export async function getTopQuestions(limit = 50): Promise<TopQuestion[]> {
  if (!kv) return []
  const flat = await kv.zrange<(string | number)[]>(COUNTS_KEY, 0, limit - 1, {
    rev: true,
    withScores: true,
  })
  const top: TopQuestion[] = []
  for (let i = 0; i < flat.length; i += 2) {
    top.push({ question: String(flat[i]), count: Number(flat[i + 1]) })
  }
  return top
}

export async function getRecentQuestions(limit = 100): Promise<RecentQuestion[]> {
  if (!kv) return []
  const raw = await kv.lrange<string | RecentQuestion>(RECENT_KEY, 0, limit - 1)
  return raw
    .map((item) => {
      try {
        return typeof item === 'string' ? (JSON.parse(item) as RecentQuestion) : item
      } catch {
        return null
      }
    })
    .filter((x): x is RecentQuestion => x !== null && typeof x.question === 'string')
}

export async function getTotalQuestionCount(): Promise<number> {
  if (!kv) return 0
  return (await kv.get<number>(TOTAL_KEY)) ?? 0
}

export function isAnalyticsConfigured(): boolean {
  return kv !== null
}
