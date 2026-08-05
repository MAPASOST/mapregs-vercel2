import { getDashboardStats, isAnalyticsConfigured, type GapReason } from '@/lib/analytics'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Question Analytics — MAP Regs Admin',
  robots: { index: false, follow: false },
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Question Analytics</h1>
        <p className="text-slate-500 text-sm mb-8">
          What people are asking the MA School Age Regulations chatbot
        </p>
        {children}
      </div>
    </div>
  )
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { key?: string }
}) {
  const adminKey = process.env.ADMIN_KEY

  if (!adminKey) {
    return (
      <Shell>
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 text-amber-900 text-sm">
          <strong>Setup required:</strong> the <code className="bg-amber-100 px-1 rounded">ADMIN_KEY</code>{' '}
          environment variable is not set on this deployment. It is normally created automatically by
          the deploy workflow — re-run the deploy, or add it manually in the Vercel dashboard under
          Settings → Environment Variables.
        </div>
      </Shell>
    )
  }

  const providedKey = searchParams.key?.trim()

  if (providedKey !== adminKey) {
    return (
      <Shell>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm max-w-md">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Admin login</h2>
          <p className="text-slate-500 text-sm mb-4">
            Enter the admin key to view question analytics.
          </p>
          {providedKey && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700 text-sm mb-4">
              That key is incorrect.
            </div>
          )}
          <form method="GET" action="/admin" className="flex gap-2">
            <input
              type="password"
              name="key"
              required
              autoFocus
              placeholder="Admin key"
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2"
            >
              Sign in
            </button>
          </form>
          <p className="text-slate-400 text-xs mt-4">
            The key is the <code className="bg-slate-100 px-1 rounded">ADMIN_KEY</code> environment
            variable: Vercel dashboard → mapregs project → Settings → Environment Variables.
          </p>
        </div>
      </Shell>
    )
  }

  if (!isAnalyticsConfigured()) {
    return (
      <Shell>
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 text-amber-900 text-sm">
          <strong>No Blob store attached.</strong> Question tracking needs Vercel Blob storage. It is
          normally created automatically by the deploy workflow — re-run the deploy, or create one in
          the Vercel dashboard: <strong>mapregs</strong> project → <strong>Storage</strong> →{' '}
          <strong>Create Database → Blob</strong>, then redeploy.
        </div>
      </Shell>
    )
  }

  const { top, recent, total, capped, answered, fallbacks, thumbsUp, thumbsDown, gaps } =
    await getDashboardStats(50, 100)

  const lowConfidence = gaps.reduce((sum, g) => sum + g.count, 0)

  const reasonBadge: Record<GapReason, { label: string; className: string }> = {
    'no-answer': { label: 'No answer', className: 'bg-red-100 text-red-700' },
    'thumbs-down': { label: '👎 Thumbs down', className: 'bg-amber-100 text-amber-800' },
  }

  return (
    <Shell>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-3xl font-bold text-blue-600">
            {total.toLocaleString()}
            {capped ? '+' : ''}
          </div>
          <div className="text-sm text-slate-500 mt-1">Total questions asked</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-3xl font-bold text-emerald-600">{answered.toLocaleString()}</div>
          <div className="text-sm text-slate-500 mt-1">Answered</div>
        </div>
        <div className="bg-white border border-red-200 rounded-xl p-5 shadow-sm">
          <div className="text-3xl font-bold text-red-600">{lowConfidence.toLocaleString()}</div>
          <div className="text-sm text-slate-500 mt-1">Low-confidence / no answer</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-3xl font-bold text-slate-700">
            <span className="text-emerald-600">👍 {thumbsUp.toLocaleString()}</span>{' '}
            <span className="text-red-500">👎 {thumbsDown.toLocaleString()}</span>
          </div>
          <div className="text-sm text-slate-500 mt-1">Reader feedback</div>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-800 mb-1">
          🚨 Knowledge gaps — questions the bot couldn&apos;t answer well
        </h2>
        <p className="text-slate-500 text-sm mb-3">
          Questions that hit a fallback/&quot;I don&apos;t know&quot; response ({fallbacks.toLocaleString()} total)
          or got a thumbs-down from a reader. Use this list to find missing knowledge-base coverage.
        </p>
        {gaps.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-5 text-slate-500 text-sm shadow-sm">
            Nothing here yet — entries appear when an answer falls back to &quot;I don&apos;t
            know&quot; or a reader clicks 👎 under an answer.
          </div>
        ) : (
          <div className="bg-white border border-red-200 rounded-xl shadow-sm divide-y divide-slate-100">
            {gaps.map((g, i) => (
              <div key={`${g.ts}-${i}`} className="px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-slate-800 text-sm flex-1 min-w-[200px]">{g.question}</span>
                {g.reasons.map((r) => (
                  <span
                    key={r}
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${reasonBadge[r].className}`}
                  >
                    {reasonBadge[r].label}
                  </span>
                ))}
                {g.count > 1 && (
                  <span className="text-xs font-semibold text-slate-500">×{g.count}</span>
                )}
                <span className="text-slate-400 text-xs whitespace-nowrap">
                  {new Date(g.ts).toLocaleString('en-US', { timeZone: 'America/New_York' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Most common questions</h2>
        {top.length === 0 ? (
          <p className="text-slate-500 text-sm">
            No questions recorded yet — they will appear here as soon as someone uses the chatbot.
          </p>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium w-12">#</th>
                  <th className="px-4 py-2 font-medium">Question</th>
                  <th className="px-4 py-2 font-medium w-24 text-right">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {top.map((q, i) => (
                  <tr key={`${q.question}-${i}`} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-slate-400">{i + 1}</td>
                    <td className="px-4 py-2 text-slate-800">{q.question}</td>
                    <td className="px-4 py-2 text-right font-semibold text-blue-600">{q.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Recent questions</h2>
        {recent.length === 0 ? (
          <p className="text-slate-500 text-sm">No questions recorded yet.</p>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm divide-y divide-slate-100">
            {recent.map((q, i) => (
              <div key={`${q.ts}-${i}`} className="px-4 py-3 flex justify-between gap-4">
                <span className="text-slate-800 text-sm">{q.question}</span>
                <span className="text-slate-400 text-xs whitespace-nowrap">
                  {new Date(q.ts).toLocaleString('en-US', { timeZone: 'America/New_York' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </Shell>
  )
}
