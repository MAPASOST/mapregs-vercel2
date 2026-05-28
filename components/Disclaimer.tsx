'use client'

import { useState } from 'react'

export default function Disclaimer() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-5 mb-5">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-amber-800 text-base">⚠️ Important Disclaimer</div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-amber-700 text-sm underline hover:no-underline"
        >
          {collapsed ? 'Show' : 'Hide'}
        </button>
      </div>

      {!collapsed && (
        <div className="text-amber-900 text-sm space-y-2">
          <p>
            <strong>This chatbot is an unofficial, independently developed tool by the Massachusetts Afterschool Partnership (MAP) and is not affiliated with, endorsed by, or connected to the Massachusetts Department of Early Education and Care (EEC) or any other state agency.</strong>
          </p>
          <p>
            The information provided is for general informational purposes only and should not be relied upon as legal, regulatory, or compliance advice. Always verify information against official EEC regulations.
          </p>
          <p>
            <strong>By using this chatbot, you acknowledge that you do so at your own risk.</strong>
          </p>
        </div>
      )}

      <div className="mt-3">
        <a
          href="https://www.mass.gov/lists/eec-laws-and-regulations"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <span>📄</span>
          <span>View Official EEC Laws &amp; Regulations</span>
          <span>→</span>
        </a>
      </div>
    </div>
  )
}
