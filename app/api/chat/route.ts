import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { kv } from '@/lib/kv'
import { logQuestion } from '@/lib/analytics'
import { documents } from '@/lib/documents'
import { CLAUDE_MODEL, MAX_TOKENS, SYSTEM_PROMPT, SESSION_TTL } from '@/lib/constants'
import type { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const { messages, sessionId } = await req.json() as {
      messages: Message[]
      sessionId?: string
    }

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'No messages provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const latestUserMessage = messages[messages.length - 1]
    if (latestUserMessage.role !== 'user') {
      return new Response(JSON.stringify({ error: 'Last message must be from user' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Track what people are asking (no-op until a KV store is attached)
    await logQuestion(latestUserMessage.content)

    // Retrieve conversation history from KV if sessionId is provided
    let history: Message[] = []
    if (sessionId && kv) {
      try {
        const stored = await kv.get<Message[]>(`session:${sessionId}`)
        if (stored) history = stored
      } catch {
        // KV unavailable — proceed without history
      }
    }

    // Get relevant document context for the latest question
    const documentContext = documents.getRelevantDocumentContent(latestUserMessage.content)

    // Build system prompt with document context injected
    const systemWithContext = `${SYSTEM_PROMPT}

Here are the Massachusetts school age program regulation documents you should reference:

${documentContext}

Now answer the user's question based ONLY on the information in these documents. Include specific citations (document name, section, page) for all information you provide.`

    // Combine stored history with new messages for the API call
    const allMessages: Message[] = [
      ...history,
      ...messages,
    ]

    const result = streamText({
      model: anthropic(CLAUDE_MODEL),
      system: systemWithContext,
      messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
      maxTokens: MAX_TOKENS,
      onFinish: async ({ text }) => {
        // Persist updated conversation to KV
        if (sessionId && kv) {
          const updatedHistory: Message[] = [
            ...allMessages,
            { role: 'assistant', content: text },
          ]
          try {
            await kv.set(`session:${sessionId}`, updatedHistory, { ex: SESSION_TTL })
          } catch {
            // KV write failure is non-fatal
          }
        }
      },
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
