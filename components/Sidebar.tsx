'use client'

import { useEffect, useState } from 'react'
import { documents } from '@/lib/documents'
import { SAMPLE_QUESTION_ROTATION_INTERVAL } from '@/lib/constants'

interface SidebarProps {
  onQuestionClick: (question: string) => void
}

export default function Sidebar({ onQuestionClick }: SidebarProps) {
  const [sampleQuestions, setSampleQuestions] = useState<string[]>([])
  const docList = documents.getDocumentList()

  useEffect(() => {
    setSampleQuestions(documents.getRandomQuestions(5))
    const interval = setInterval(() => {
      setSampleQuestions(documents.getRandomQuestions(5))
    }, SAMPLE_QUESTION_ROTATION_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  return (
    <aside className="w-full lg:w-72 xl:w-80 shrink-0 space-y-5">
      {/* Sample Questions */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
        <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide mb-3">
          Sample Questions
        </h2>
        <div className="space-y-2">
          {sampleQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => onQuestionClick(q)}
              className="w-full text-left text-sm text-slate-700 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-lg px-3 py-2 transition-colors leading-snug"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Available Documents */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
        <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide mb-3">
          Available Documents
        </h2>
        <div className="space-y-3">
          {docList.map((doc) => (
            <div key={doc.name} className="border-l-4 border-blue-500 pl-3">
              <div className="text-sm font-medium text-slate-800 leading-snug">{doc.name}</div>
              <div className="text-xs text-slate-500 mt-0.5 leading-snug">{doc.description}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
