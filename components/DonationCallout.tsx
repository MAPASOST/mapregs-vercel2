import { DONATE_URL } from '@/lib/constants'

export default function DonationCallout() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h3 className="font-semibold text-blue-900 text-base mb-1">💙 Help Keep This Tool Free</h3>
        <p className="text-blue-800 text-sm">
          This AI chatbot uses API services with per-query costs. Your donation helps cover expenses
          and keep this resource available to the Massachusetts afterschool community.
        </p>
      </div>
      <a
        href={DONATE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        <span>❤️</span>
        <span>Support MAP</span>
        <span>→</span>
      </a>
    </div>
  )
}
