import { EEC_REGS_URL } from '@/lib/constants'

export default function Disclaimer() {
  return (
    <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-5 mb-5">
      <div className="font-semibold text-amber-800 text-base mb-2">⚠️ Important Disclaimer</div>

      <div className="text-amber-900 text-sm space-y-2">
        <p>
          <strong>
            This chatbot is an unofficial, independently developed tool by the Massachusetts
            Afterschool Partnership (MAP) and is not affiliated with, endorsed by, or connected to
            the Massachusetts Department of Early Education and Care (EEC) or any other state
            agency.
          </strong>
        </p>

        <p>
          The information provided by this chatbot is for general informational purposes only and
          should not be relied upon as legal, regulatory, or compliance advice. This tool is not a
          substitute for reading the actual EEC regulations, consulting official EEC resources, or
          seeking professional guidance.
        </p>

        <p>
          While efforts have been made to provide accurate information, this chatbot may contain
          errors, omissions, or outdated content. Users should always verify information against
          official EEC regulations and guidance documents available at{' '}
          <a
            href="https://www.mass.gov/eec"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium hover:text-amber-700"
          >
            mass.gov/eec
          </a>
          .
        </p>

        <p>
          <strong>
            By using this chatbot, you acknowledge that you do so at your own risk and that the
            developer assumes no liability for any decisions made based on information provided
            here.
          </strong>
        </p>
      </div>

      <div className="mt-3">
        <a
          href={EEC_REGS_URL}
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
