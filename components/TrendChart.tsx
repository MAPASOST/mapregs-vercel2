import type { DailyCount } from '@/lib/analytics'

// Server-rendered column chart of questions per day. Single series, so the
// section heading names it and no legend is needed; per-column <title> tooltips
// and the sr-only table carry exact values.

const W = 720
const H = 220
const PAD_L = 40
const PAD_R = 8
const PAD_T = 12
const PAD_B = 26
const BAR_W = 14
const CORNER = 4

// Smallest of 2/4/10 × 10^k ≥ n, so the midpoint tick is always a clean integer
function niceMax(n: number): number {
  if (n <= 2) return 2
  const pow = Math.pow(10, Math.floor(Math.log10(n)))
  for (const m of [2, 4, 10]) {
    if (m * pow >= n) return m * pow
  }
  return 20 * pow
}

function shortDay(day: string): string {
  const [, m, d] = day.split('-')
  return `${Number(m)}/${Number(d)}`
}

function longDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export default function TrendChart({ daily }: { daily: DailyCount[] }) {
  const max = niceMax(Math.max(1, ...daily.map((d) => d.count)))
  const plotW = W - PAD_L - PAD_R
  const plotH = H - PAD_T - PAD_B
  const baseline = PAD_T + plotH
  const slot = plotW / daily.length
  const ticks = [0, max / 2, max]

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Questions per day over the last ${daily.length} days`}
      >
        {ticks.map((t) => {
          const y = baseline - (t / max) * plotH
          return (
            <g key={t}>
              <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke="#e2e8f0" strokeWidth={1} />
              <text x={PAD_L - 8} y={y + 4} textAnchor="end" fontSize={11} fill="#94a3b8">
                {t.toLocaleString()}
              </text>
            </g>
          )
        })}

        {daily.map((d, i) => {
          const x = PAD_L + i * slot + (slot - BAR_W) / 2
          const h = (d.count / max) * plotH
          const top = baseline - h
          const r = Math.min(CORNER, h)
          const label = `${longDay(d.day)}: ${d.count.toLocaleString()} question${d.count === 1 ? '' : 's'}`
          return (
            <g key={d.day}>
              {d.count > 0 && (
                // Rounded at the data end only; square at the baseline
                <path
                  d={`M ${x} ${baseline} L ${x} ${top + r} Q ${x} ${top} ${x + r} ${top} L ${x + BAR_W - r} ${top} Q ${x + BAR_W} ${top} ${x + BAR_W} ${top + r} L ${x + BAR_W} ${baseline} Z`}
                  fill="#2563eb"
                >
                  <title>{label}</title>
                </path>
              )}
              {/* Full-slot hover target so zero days are inspectable too */}
              <rect x={PAD_L + i * slot} y={PAD_T} width={slot} height={plotH} fill="transparent">
                <title>{label}</title>
              </rect>
              {(i % 5 === 0 || i === daily.length - 1) && (
                <text
                  x={x + BAR_W / 2}
                  y={H - 8}
                  textAnchor="middle"
                  fontSize={11}
                  fill="#94a3b8"
                >
                  {shortDay(d.day)}
                </text>
              )}
            </g>
          )
        })}

        <line
          x1={PAD_L}
          x2={W - PAD_R}
          y1={baseline}
          y2={baseline}
          stroke="#cbd5e1"
          strokeWidth={1}
        />
      </svg>

      <table className="sr-only">
        <caption>Questions per day</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Questions</th>
          </tr>
        </thead>
        <tbody>
          {daily.map((d) => (
            <tr key={d.day}>
              <td>{d.day}</td>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
