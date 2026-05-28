export default function LoadingIndicator() {
  return (
    <div className="flex gap-3 flex-row">
      <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white mt-1 bg-gradient-to-br from-slate-500 to-slate-700">
        AI
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="text-xs font-semibold text-slate-500 mb-2">AI Assistant</div>
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <span>Analyzing regulations</span>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
