import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { NextResponse, type NextRequest } from 'next/server'
import { logQuestion } from '@/lib/analytics'
import { documents } from '@/lib/documents'
import { isRateLimited } from '@/lib/rate-limit'
import { CLAUDE_MODEL, MAX_TOKENS, SYSTEM_PROMPT } from '@/lib/constants'

export const runtime = 'nodejs'
export const maxDuration = 60

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown'
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Rate limit: please wait a few seconds between questions.' },
        { status: 429 }
      )
    }

    const { messages } = (await req.json()) as { messages: Message[] }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
    }

    const latestUserMessage = messages[messages.length - 1]
    if (latestUserMessage.role !== 'user') {
      return NextResponse.json({ error: 'Last message must be from user' }, { status: 400 })
    }

    // Track what people are asking. Deliberately not awaited — analytics must
    // not add latency to the first streamed token, and logQuestion swallows
    // its own errors.
    void logQuestion(latestUserMessage.content)

    // Get relevant document context for the latest question
    const documentContext = documents.getRelevantDocumentContent(latestUserMessage.content)

    // Build system prompt with document context injected
    const systemWithContext = `${SYSTEM_PROMPT}

Here are the Massachusetts school age program regulation documents you should reference:

${documentContext}

Now answer the user's question based ONLY on the information in these documents. Include specific citations (document name, section, page) for all information you provide.`

    const result = streamText({
      model: anthropic(CLAUDE_MODEL),
      system: systemWithContext,
      // The client sends the full conversation on every request
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      maxTokens: MAX_TOKENS,
    })

    return result.toDataStreamResponse({
      getErrorMessage: (error) => {
        const message = error instanceof Error ? error.message : String(error)
        if (message.includes('429') || /rate.?limit/i.test(message)) {
          return 'Rate limit reached (429): the AI service needs a short break. Please wait about a minute and try again.'
        }
        console.error('Chat stream error:', error)
        return 'The AI service returned an error. Please try again in a moment.'
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
