import { getQuestionStats, isAnalyticsConfigured } from '@/lib/analytics'

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

  if (searchParams.key !== adminKey) {
    return (
      <Shell>
        <div className="bg-red-50 border border-red-300 rounded-xl p-5 text-red-800 text-sm">
          Unauthorized. Append <code className="bg-red-100 px-1 rounded">?key=YOUR_ADMIN_KEY</code> to
          the URL. The key is in the Vercel dashboard under the mapregs project → Settings →
          Environment Variables → ADMIN_KEY.
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

  const { top, recent, total, capped } = await getQuestionStats(50, 100)

  return (
    <Shell>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-3xl font-bold text-blue-600">
            {total.toLocaleString()}
            {capped ? '+' : ''}
          </div>
          <div className="text-sm text-slate-500 mt-1">Total questions asked</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-3xl font-bold text-violet-600">{top.length.toLocaleString()}</div>
          <div className="text-sm text-slate-500 mt-1">Distinct questions (top 50 shown)</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-3xl font-bold text-emerald-600">{recent.length.toLocaleString()}</div>
          <div className="text-sm text-slate-500 mt-1">Recent questions shown</div>
        </div>
      </div>

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
