import type { ScoreTrendPoint } from '../types'

const WIDTH = 600
const HEIGHT = 160
const PAD = 12

export function ScoreTrendChart({ points }: { points: ScoreTrendPoint[] }) {
  if (points.length < 2) {
    return (
      <div className="h-40 flex items-center justify-center text-xs text-ink-faint">
        Faça mais análises para ver sua evolução ao longo do tempo.
      </div>
    )
  }

  const xs = points.map((_, i) => PAD + (i * (WIDTH - PAD * 2)) / (points.length - 1))
  const ys = points.map((p) => HEIGHT - PAD - p.score * (HEIGHT - PAD * 2))

  const linePath = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x} ${ys[i]}`).join(' ')
  const areaPath = `${linePath} L ${xs[xs.length - 1]} ${HEIGHT - PAD} L ${xs[0]} ${HEIGHT - PAD} Z`

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-40" preserveAspectRatio="none">
      <defs>
        <linearGradient id="score-trend-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#score-trend-fill)" />
      <path d={linePath} fill="none" stroke="var(--color-accent-strong)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {xs.map((x, i) => (
        <circle key={i} cx={x} cy={ys[i]} r="3" fill="var(--color-accent-strong)" />
      ))}
    </svg>
  )
}
