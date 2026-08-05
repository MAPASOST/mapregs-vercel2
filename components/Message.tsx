import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { documentList } from '@/lib/documents-meta'

interface MessageProps {
  role: 'user' | 'assistant'
  content: string
  // The user question this assistant message answered — enables feedback
  question?: string
  // Hidden while the answer is still streaming
  showFeedback?: boolean
}

interface Citation {
  source: string
  text: string
}

// Port of the original site's citation extraction: surface the section, page,
// and document references the model cited so readers can verify answers
// against the official regulations.
function extractCitations(content: string): Citation[] {
  const citations: Citation[] = []

  for (const match of content.matchAll(/(?:Section|§)\s+[\d.]+[^\n]*/gi)) {
    citations.push({ source: 'Section Reference', text: match[0].trim() })
  }

  for (const match of content.matchAll(/(?:Page|p\.)\s+\d+[^\n]*/gi)) {
    citations.push({ source: 'Page Reference', text: match[0].trim() })
  }

  for (const doc of documentList) {
    const shortName = doc.name.split(':')[0]
    if (content.includes(shortName)) {
      citations.push({ source: doc.name, text: 'Referenced in response' })
    }
  }

  // Dedupe by text, cap to keep the panel readable
  const seen = new Set<string>()
  return citations
    .filter((c) => {
      if (seen.has(c.text)) return false
      seen.add(c.text)
      return true
    })
    .slice(0, 12)
}

function FeedbackButtons({ question }: { question: string }) {
  const [vote, setVote] = useState<'up' | 'down' | null>(null)

  function sendVote(next: 'up' | 'down') {
    if (vote) return
    setVote(next)
    // Fire-and-forget: feedback must never interrupt reading the answer
    void fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vote: next, question }),
    }).catch(() => {})
  }

  return (
    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-2">
      {vote ? (
        <span className="text-xs text-slate-400">
          {vote === 'up' ? 'Thanks for the feedback!' : 'Thanks — we’ll use this to improve answers.'}
        </span>
      ) : (
        <>
          <span className="text-xs text-slate-400">Was this helpful?</span>
          <button
            type="button"
            onClick={() => sendVote('up')}
            aria-label="Yes, this answer was helpful"
            className="text-sm px-2 py-0.5 rounded-md hover:bg-slate-100 transition-colors"
          >
            👍
          </button>
          <button
            type="button"
            onClick={() => sendVote('down')}
            aria-label="No, this answer was not helpful"
            className="text-sm px-2 py-0.5 rounded-md hover:bg-slate-100 transition-colors"
          >
            👎
          </button>
        </>
      )}
    </div>
  )
}

export default function Message({ role, content, question, showFeedback }: MessageProps) {
  const isUser = role === 'user'
  const citations = isUser ? [] : extractCitations(content)

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white mt-1 ${
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-violet-600'
            : 'bg-gradient-to-br from-slate-500 to-slate-700'
        }`}
      >
        {isUser ? 'Y' : 'AI'}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
          isUser
            ? 'bg-gradient-to-br from-blue-600 to-violet-700 text-white rounded-tr-sm'
            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
        }`}
      >
        <div className={`text-xs font-semibold mb-1 ${isUser ? 'text-blue-100' : 'text-slate-500'}`}>
          {isUser ? 'You' : 'AI Assistant'}
        </div>

        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        ) : (
          <>
            <div className="prose-chat text-sm">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>

            {citations.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="text-xs font-semibold text-slate-500 mb-1.5">📎 Citations</div>
                <div className="space-y-1">
                  {citations.map((c, i) => (
                    <div key={i} className="text-xs">
                      <span className="font-medium text-blue-700">{c.source}: </span>
                      <span className="text-slate-600">{c.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showFeedback && question && <FeedbackButtons question={question} />}
          </>
        )}
      </div>
    </div>
  )
}
