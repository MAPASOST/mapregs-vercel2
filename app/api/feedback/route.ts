import { NextResponse, type NextRequest } from 'next/server'
import { logFeedback } from '@/lib/analytics'
import { isFeedbackRateLimited } from '@/lib/rate-limit'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown'
    if (isFeedbackRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = (await req.json()) as { vote?: unknown; question?: unknown }
    const vote = body.vote
    const question = typeof body.question === 'string' ? body.question.trim() : ''

    if ((vote !== 'up' && vote !== 'down') || !question || question.length > 500) {
      return NextResponse.json({ error: 'Invalid feedback' }, { status: 400 })
    }

    await logFeedback({ question, vote })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
