import { put, list } from '@vercel/blob'

// Every record is stored as its own tiny blob; all metadata is encoded in the
// pathname so the dashboard can compute stats from list() scans with no
// per-blob fetches and no write races.
//
// Record formats (base64url never contains '.', so '.' is a safe separator):
//   q/<ts>.<rand>.<b64(question)>.txt                     — a question was asked
//   a/<ts>.<rand>.<ok|fb>.<b64(sections)>.<b64(question)>.txt — how it was answered
//                                                           (fb = fallback/no answer;
//                                                            sections joined with '|')
//   f/<ts>.<rand>.<up|down>.<b64(question)>.txt           — reader thumbs feedback
const PREFIX_Q = 'q/'
const PREFIX_A = 'a/'
const PREFIX_F = 'f/'
const SCAN_CAP = 20000
// Vercel Blob pathnames max out near 950 chars; keep well under it so
// multibyte questions (CJK, emoji) never make put() reject.
const MAX_ENCODED_LENGTH = 600
const MAX_SECTIONS_CHARS = 180

export interface RecentQuestion {
  question: string
  ts: number
}

export interface TopQuestion {
  question: string
  count: number
  // How many distinct phrasings were grouped into this entry
  variants: number
}

export type GapReason = 'no-answer' | 'thumbs-down'

export interface GapEntry {
  question: string
  ts: number
  count: number
  reasons: GapReason[]
}

export interface CitedSection {
  section: string
  count: number
}

export interface CategoryCount {
  category: string
  count: number
}

export interface DailyCount {
  // YYYY-MM-DD in America/New_York
  day: string
  count: number
}

export interface DashboardStats {
  top: TopQuestion[]
  recent: RecentQuestion[]
  total: number
  capped: boolean
  answered: number
  fallbacks: number
  thumbsUp: number
  thumbsDown: number
  gaps: GapEntry[]
  citations: CitedSection[]
  categories: CategoryCount[]
  daily: DailyCount[]
}

// Collapse near-duplicate phrasings so counts aggregate sensibly
export function normalizeQuestion(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[?!.]+$/, '')
}

export function isAnalyticsConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

// ---------------------------------------------------------------------------
// Writing records

function randomId(): string {
  return Math.random().toString(36).slice(2, 8)
}

// Cap and base64url-encode text so the final pathname stays within limits
function encodeCapped(raw: string): { text: string; encoded: string } {
  let text = raw.trim().slice(0, 300)
  let encoded = Buffer.from(text).toString('base64url')
  while (encoded.length > MAX_ENCODED_LENGTH && text.length > 10) {
    text = text.slice(0, text.length - 20)
    encoded = Buffer.from(text).toString('base64url')
  }
  return { text, encoded }
}

async function putRecord(pathname: string, content: string): Promise<void> {
  await put(pathname, content, {
    access: 'private',
    addRandomSuffix: false,
    contentType: 'text/plain',
  })
}

export async function logQuestion(question: string): Promise<void> {
  if (!isAnalyticsConfigured()) return
  try {
    const { text, encoded } = encodeCapped(question)
    if (!text) return
    await putRecord(`${PREFIX_Q}${Date.now()}.${randomId()}.${encoded}.txt`, text)
  } catch (err) {
    console.error('analytics: failed to log question', err)
  }
}

export async function logAnswer(opts: {
  question: string
  fallback: boolean
  citedSections: string[]
}): Promise<void> {
  if (!isAnalyticsConfigured()) return
  try {
    const { text, encoded } = encodeCapped(opts.question)
    if (!text) return
    const outcome = opts.fallback ? 'fb' : 'ok'
    const sections = Buffer.from(
      opts.citedSections.join('|').slice(0, MAX_SECTIONS_CHARS)
    ).toString('base64url')
    await putRecord(
      `${PREFIX_A}${Date.now()}.${randomId()}.${outcome}.${sections}.${encoded}.txt`,
      text
    )
  } catch (err) {
    console.error('analytics: failed to log answer', err)
  }
}

export async function logFeedback(opts: { question: string; vote: 'up' | 'down' }): Promise<void> {
  if (!isAnalyticsConfigured()) return
  try {
    const { text, encoded } = encodeCapped(opts.question)
    if (!text) return
    await putRecord(`${PREFIX_F}${Date.now()}.${randomId()}.${opts.vote}.${encoded}.txt`, text)
  } catch (err) {
    console.error('analytics: failed to log feedback', err)
  }
}

// ---------------------------------------------------------------------------
// Parsing records back out of pathnames

function decodeB64(part: string): string | null {
  try {
    return Buffer.from(part, 'base64url').toString('utf8')
  } catch {
    return null
  }
}

function stripWrapper(pathname: string, prefix: string): string[] | null {
  if (!pathname.startsWith(prefix) || !pathname.endsWith('.txt')) return null
  return pathname.slice(prefix.length, -4).split('.')
}

function parseQuestionRecord(pathname: string): RecentQuestion | null {
  const parts = stripWrapper(pathname, PREFIX_Q)
  if (!parts || parts.length !== 3) return null
  const ts = Number(parts[0])
  if (!Number.isFinite(ts)) return null
  const question = decodeB64(parts[2])
  return question ? { question, ts } : null
}

interface AnswerRecord {
  ts: number
  fallback: boolean
  sections: string[]
  question: string
}

function parseAnswerRecord(pathname: string): AnswerRecord | null {
  const parts = stripWrapper(pathname, PREFIX_A)
  if (!parts || parts.length !== 5) return null
  const ts = Number(parts[0])
  if (!Number.isFinite(ts) || (parts[2] !== 'ok' && parts[2] !== 'fb')) return null
  const question = decodeB64(parts[4])
  if (!question) return null
  const joined = decodeB64(parts[3]) ?? ''
  const sections = joined ? joined.split('|').filter(Boolean) : []
  return { ts, fallback: parts[2] === 'fb', sections, question }
}

interface FeedbackRecord {
  ts: number
  vote: 'up' | 'down'
  question: string
}

function parseFeedbackRecord(pathname: string): FeedbackRecord | null {
  const parts = stripWrapper(pathname, PREFIX_F)
  if (!parts || parts.length !== 4) return null
  const ts = Number(parts[0])
  if (!Number.isFinite(ts) || (parts[2] !== 'up' && parts[2] !== 'down')) return null
  const question = decodeB64(parts[3])
  return question ? { ts, vote: parts[2], question } : null
}

async function scanPrefix(prefix: string): Promise<{ pathnames: string[]; capped: boolean }> {
  const pathnames: string[] = []
  let cursor: string | undefined
  let capped = false
  do {
    const res = await list({ prefix, limit: 1000, cursor })
    for (const blob of res.blobs) pathnames.push(blob.pathname)
    cursor = res.cursor
    if (pathnames.length >= SCAN_CAP) {
      capped = Boolean(cursor)
      break
    }
  } while (cursor)
  return { pathnames, capped }
}

// ---------------------------------------------------------------------------
// Topic categories: first matching rule wins, so more specific topics come
// before broader ones (e.g. "authorization" hits Financial Assistance before
// "documentation" could hit Enrollment & Records).

const CATEGORY_RULES: Array<[string, RegExp]> = [
  ['Financial Assistance', /subsid|voucher|financial assistance|income eligible|parent fee|\bdta\b|\bdcf\b|young parent|payment|co-?pay|authoriz/],
  ['Background Checks', /background|\bbrc\b|\bcori\b|\bsori\b|fingerprint|disqualif|suitab/],
  ['Staffing & Ratios', /ratio|staff|educator|group leader|administrator|qualificat|supervis|professional development|training|certif/],
  ['Licensing & Enforcement', /licens|enforc|\bfine|sanction|probation|revo(?:ke|cation)|suspen|deficien|appeal|exempt|complian|inspect|right to visit/],
  ['Health & Safety', /health|safety|medicat|medical|emergen|injur|illness|infection|sanit|first aid|allerg|immuniz|abuse|neglect/],
  ['Transportation', /transport|vehicle|field trip|\bbus\b|driver/],
  ['Food & Nutrition', /nutrition|\bfood\b|\bmeal|snack|feeding/],
  ['Facilities & Space', /\bspace|facilit|playground|outdoor|indoor|square (?:feet|footage)|equipment|premises/],
  ['Child Guidance & Behavior', /guidance|disciplin|behavior|prohibited|restraint|time-?out/],
  ['Curriculum & Programming', /curricul|activit|programming|schedule|screen time/],
  ['Enrollment & Records', /enroll|record|document|consent|notif|communicat|confidential/],
]

export function categorizeQuestion(question: string): string {
  const q = normalizeQuestion(question)
  for (const [category, re] of CATEGORY_RULES) {
    if (re.test(q)) return category
  }
  return 'Other'
}

// ---------------------------------------------------------------------------
// Question clustering: group near-duplicate phrasings by word overlap (Dice
// coefficient on stemmed content words) so "most common questions" reflects
// real demand instead of fragmenting across variants.

const STOPWORDS = new Set([
  'what', 'are', 'the', 'for', 'a', 'an', 'of', 'to', 'in', 'is', 'under',
  'must', 'be', 'can', 'do', 'does', 'how', 'who', 'and', 'or', 'with',
  'about', 'there', 'my', 'i', 'me', 'you', 'that', 'this', 'it',
])
const CLUSTER_SIMILARITY = 0.6
const MAX_CLUSTERED_DISTINCT = 400

function contentWords(normalized: string): Set<string> {
  const words = new Set<string>()
  for (const raw of normalized.split(/[^a-z0-9]+/)) {
    if (raw.length < 3 || STOPWORDS.has(raw)) continue
    // Light stemming: strip plural/trailing 's' so ratio/ratios match
    words.add(raw.endsWith('s') ? raw.slice(0, -1) : raw)
  }
  return words
}

function diceSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let overlap = 0
  for (const w of a) if (b.has(w)) overlap++
  return (2 * overlap) / (a.size + b.size)
}

function clusterQuestions(
  counts: Map<string, { question: string; count: number }>,
  topLimit: number
): TopQuestion[] {
  const items = [...counts.values()].sort((a, b) => b.count - a.count)
  const clusters: Array<{ words: Set<string>; question: string; count: number; variants: number }> =
    []

  for (const [i, item] of items.entries()) {
    // O(n²) guard: the long tail beyond the cap joins as singletons
    if (i < MAX_CLUSTERED_DISTINCT) {
      const words = contentWords(normalizeQuestion(item.question))
      const match = clusters.find((c) => diceSimilarity(c.words, words) >= CLUSTER_SIMILARITY)
      if (match) {
        match.count += item.count
        match.variants += 1
        continue
      }
      clusters.push({ words, question: item.question, count: item.count, variants: 1 })
    } else {
      clusters.push({ words: new Set(), question: item.question, count: item.count, variants: 1 })
    }
  }

  return clusters
    .sort((a, b) => b.count - a.count)
    .slice(0, topLimit)
    .map(({ question, count, variants }) => ({ question, count, variants }))
}

// ---------------------------------------------------------------------------
// Daily counts, bucketed in Eastern time (the audience is Massachusetts)

const DAY_FORMAT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const TREND_DAYS = 30

function dailyCounts(entries: RecentQuestion[]): DailyCount[] {
  const byDay = new Map<string, number>()
  for (const e of entries) {
    const day = DAY_FORMAT.format(new Date(e.ts))
    byDay.set(day, (byDay.get(day) ?? 0) + 1)
  }
  // Zero-fill the last TREND_DAYS so quiet days are visible in the chart
  const series: DailyCount[] = []
  const now = Date.now()
  for (let i = TREND_DAYS - 1; i >= 0; i--) {
    const day = DAY_FORMAT.format(new Date(now - i * 24 * 60 * 60 * 1000))
    series.push({ day, count: byDay.get(day) ?? 0 })
  }
  return series
}

// ---------------------------------------------------------------------------

export async function getDashboardStats(topLimit = 50, recentLimit = 100): Promise<DashboardStats> {
  const empty: DashboardStats = {
    top: [],
    recent: [],
    total: 0,
    capped: false,
    answered: 0,
    fallbacks: 0,
    thumbsUp: 0,
    thumbsDown: 0,
    gaps: [],
    citations: [],
    categories: [],
    daily: [],
  }
  if (!isAnalyticsConfigured()) return empty

  const [qScan, aScan, fScan] = await Promise.all([
    scanPrefix(PREFIX_Q),
    scanPrefix(PREFIX_A),
    scanPrefix(PREFIX_F),
  ])

  const questions = qScan.pathnames
    .map(parseQuestionRecord)
    .filter((e): e is RecentQuestion => e !== null)
  const answers = aScan.pathnames.map(parseAnswerRecord).filter((e): e is AnswerRecord => e !== null)
  const feedback = fScan.pathnames
    .map(parseFeedbackRecord)
    .filter((e): e is FeedbackRecord => e !== null)

  // Top questions (clustered)
  const counts = new Map<string, { question: string; count: number }>()
  for (const entry of questions) {
    const norm = normalizeQuestion(entry.question)
    const existing = counts.get(norm)
    if (existing) {
      existing.count += 1
    } else {
      counts.set(norm, { question: entry.question, count: 1 })
    }
  }
  const top = clusterQuestions(counts, topLimit)

  const recent = [...questions].sort((a, b) => b.ts - a.ts).slice(0, recentLimit)

  // Answer quality
  const answered = answers.filter((a) => !a.fallback).length
  const fallbacks = answers.length - answered
  const thumbsUp = feedback.filter((f) => f.vote === 'up').length
  const thumbsDown = feedback.length - thumbsUp

  // Knowledge gaps: fallback answers + thumbs-down feedback, merged per question
  const gapMap = new Map<string, GapEntry>()
  const addGap = (question: string, ts: number, reason: GapReason) => {
    const norm = normalizeQuestion(question)
    const existing = gapMap.get(norm)
    if (existing) {
      existing.count += 1
      existing.ts = Math.max(existing.ts, ts)
      if (!existing.reasons.includes(reason)) existing.reasons.push(reason)
    } else {
      gapMap.set(norm, { question, ts, count: 1, reasons: [reason] })
    }
  }
  for (const a of answers) if (a.fallback) addGap(a.question, a.ts, 'no-answer')
  for (const f of feedback) if (f.vote === 'down') addGap(f.question, f.ts, 'thumbs-down')
  const gaps = [...gapMap.values()].sort((a, b) => b.ts - a.ts).slice(0, 100)

  // Most-cited regulation sections
  const citationMap = new Map<string, number>()
  for (const a of answers) {
    for (const s of a.sections) citationMap.set(s, (citationMap.get(s) ?? 0) + 1)
  }
  const citations = [...citationMap.entries()]
    .map(([section, count]) => ({ section, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 25)

  // Topic breakdown
  const categoryMap = new Map<string, number>()
  for (const q of questions) {
    const cat = categorizeQuestion(q.question)
    categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + 1)
  }
  const categories = [...categoryMap.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)

  return {
    top,
    recent,
    total: questions.length,
    capped: qScan.capped || aScan.capped || fScan.capped,
    answered,
    fallbacks,
    thumbsUp,
    thumbsDown,
    gaps,
    citations,
    categories,
    daily: dailyCounts(questions),
  }
}
