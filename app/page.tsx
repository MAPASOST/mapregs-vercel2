import Image from 'next/image'
import Disclaimer from '@/components/Disclaimer'
import DonationCallout from '@/components/DonationCallout'
import ChatInterface from '@/components/ChatInterface'
import { DONATE_URL, EEC_REGS_URL, MAP_WEBSITE_URL } from '@/lib/constants'

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 py-6 flex flex-col flex-1 gap-5">

        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-violet-700 rounded-xl shadow-lg p-6 sm:p-8 text-white">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Massachusetts School Age Program Regulations
              </h1>
              <p className="text-blue-100 mt-1 text-base sm:text-lg font-medium">
                AI-Powered Regulation Guidance
              </p>
            </div>
            <div className="shrink-0">
              <Image
                src="/images/map-logo.png"
                alt="Massachusetts Afterschool Partnership Logo"
                width={120}
                height={90}
                className="h-16 sm:h-20 w-auto object-contain"
                priority
              />
            </div>
          </div>
        </header>

        <Disclaimer />
        <DonationCallout />

        {/* Main chat area — grows to fill remaining space */}
        <div className="flex-1 min-h-[500px]">
          <ChatInterface />
        </div>

        {/* Footer */}
        <footer className="bg-slate-800 text-slate-200 rounded-xl p-6 mt-2">
          <h3 className="font-semibold text-white text-base mb-2">
            About the Massachusetts Afterschool Partnership (MAP)
          </h3>
          <p className="text-sm text-slate-300 mb-2">
            The Massachusetts Afterschool Partnership (MAP) is a statewide public-private partnership
            dedicated to expanding and improving afterschool and summer learning opportunities for
            children and youth across the Commonwealth. MAP works to ensure that all young people have
            access to quality afterschool and summer programs that support their academic, social, and
            emotional development.
          </p>
          <p className="text-sm text-slate-300 mb-4">
            This AI-powered regulation chatbot is one of MAP&apos;s initiatives to support afterschool
            professionals in understanding and navigating Massachusetts school age program regulations.
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <a
              href={MAP_WEBSITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-blue-200 underline"
            >
              Visit MAP Website
            </a>
            <span className="text-slate-500">|</span>
            <a
              href={DONATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-blue-200 underline"
            >
              Donate
            </a>
            <span className="text-slate-500">|</span>
            <a
              href={EEC_REGS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-blue-200 underline"
            >
              Official EEC Regulations
            </a>
          </div>
        </footer>

      </div>
    </div>
  )
}
