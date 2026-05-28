import ReactMarkdown from 'react-markdown'

interface MessageProps {
  role: 'user' | 'assistant'
  content: string
}

export default function Message({ role, content }: MessageProps) {
  const isUser = role === 'user'

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
          <div className="prose-chat text-sm">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
