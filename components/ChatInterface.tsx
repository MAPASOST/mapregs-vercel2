'use client'

import { useChat } from 'ai/react'
import { useRef, useEffect, useState } from 'react'
import Message from './Message'
import LoadingIndicator from './LoadingIndicator'
import Sidebar from './Sidebar'
import { COOLDOWN_SECONDS } from '@/lib/constants'

export default function ChatInterface() {
  const [cooldownRemaining, setCooldownRemaining] = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  // Whether the view should stay glued to the newest message. Scrolling up
  // releases the pin so streaming updates never yank the user back down.
  const pinnedToBottomRef = useRef(true)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput, error } = useChat({
    api: '/api/chat',
    onFinish: () => {
      startCooldown(COOLDOWN_SECONDS)
    },
    onError: () => {
      // Don't start cooldown on error — let user retry immediately
    },
  })

  function startCooldown(seconds: number) {
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    setCooldownRemaining(seconds)
    cooldownRef.current = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!)
          cooldownRef.current = null
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function handleChatScroll() {
    const el = scrollContainerRef.current
    if (!el) return
    pinnedToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  useEffect(() => {
    const el = scrollContainerRef.current
    if (el && pinnedToBottomRef.current) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages, isLoading])

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current)
    }
  }, [])

  function handleSampleQuestion(question: string) {
    setInput(question)
    inputRef.current?.focus()
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (cooldownRemaining > 0 || isLoading) return
    pinnedToBottomRef.current = true
    handleSubmit(e)
  }

  const isSendDisabled = isLoading || cooldownRemaining > 0 || !input.trim()

  const buttonLabel = isLoading
    ? 'Sending…'
    : cooldownRemaining > 0
    ? `Wait ${cooldownRemaining}s`
    : 'Send'

  return (
    <div className="flex flex-col lg:flex-row gap-5 min-h-0 flex-1">
      <Sidebar onQuestionClick={handleSampleQuestion} />

      {/* Chat area */}
      <div className="flex flex-col flex-1 min-h-0 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Messages */}
        <div
          ref={scrollContainerRef}
          onScroll={handleChatScroll}
          className="flex-1 overflow-y-auto chat-scroll p-5 space-y-4 min-h-0"
        >
          {messages.length === 0 ? (
            <div className="text-center py-12 px-4">
              <h2 className="text-xl font-semibold text-slate-700 mb-2">Welcome!</h2>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Ask me anything about Massachusetts school age program regulations. I can help you
                understand specific requirements, compliance guidelines, and best practices.
              </p>
              <p className="text-blue-600 text-sm mt-3">
                💡 Try clicking a sample question from the sidebar, or type your own below.
              </p>
            </div>
          ) : (
            messages.map((m) => (
              <Message key={m.id} role={m.role as 'user' | 'assistant'} content={m.content} />
            ))
          )}

          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <LoadingIndicator />
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error.message.includes('429') || error.message.includes('rate limit')
                ? '⚠️ Rate limit reached. Please wait about a minute before asking another question.'
                : `An error occurred: ${error.message}`}
            </div>
          )}

        </div>

        {/* Input area */}
        <div className="border-t border-slate-200 p-4 bg-slate-50">
          <form onSubmit={onSubmit} className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              placeholder="Ask a question about MA school age program regulations…"
              rows={3}
              className="flex-1 resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  if (!isSendDisabled) {
                    const form = e.currentTarget.closest('form') as HTMLFormElement
                    form?.requestSubmit()
                  }
                }
              }}
            />
            <button
              type="submit"
              disabled={isSendDisabled}
              className="shrink-0 inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-700 hover:from-blue-700 hover:to-violet-800 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-3 rounded-xl transition-all shadow-sm"
            >
              <span>{buttonLabel}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}
