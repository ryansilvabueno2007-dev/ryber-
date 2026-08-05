import { motion } from 'framer-motion'
import type { ScoreTrendPoint } from '../types'

const WIDTH = 600
const HEIGHT = 160
const PAD = 12

export function ScoreTrendChart({ points }: { points: ScoreTrendPoint[] }) {
  if (points.length < 2) {
    return (
      <div className="h-40 sm:h-48 flex flex-col items-center justify-center gap-3 text-center px-6">
        <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-ink-faint opacity-60">
          <path
            d="M4 19V5m0 14h16M8 15l3-3 3 2 4-5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="text-sm text-ink-soft max-w-xs leading-relaxed">
          Faça mais análises para visualizar sua evolução.
        </p>
      </div>
    )
  }

  const xs = points.map((_, i) => PAD + (i * (WIDTH - PAD * 2)) / (points.length - 1))
  const ys = points.map((p) => HEIGHT - PAD - p.score * (HEIGHT - PAD * 2))

  const linePath = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x} ${ys[i]}`).join(' ')
  const areaPath = `${linePath} L ${xs[xs.length - 1]} ${HEIGHT - PAD} L ${xs[0]} ${HEIGHT - PAD} Z`

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-40 sm:h-48" preserveAspectRatio="none">
      <defs>
        <linearGradient id="score-trend-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={PAD}
          x2={WIDTH - PAD}
          y1={HEIGHT - PAD - f * (HEIGHT - PAD * 2)}
          y2={HEIGHT - PAD - f * (HEIGHT - PAD * 2)}
          stroke="var(--color-line)"
          strokeWidth="1"
          strokeDasharray="3 4"
        />
      ))}
      <motion.path
        d={areaPath}
        fill="url(#score-trend-fill)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      />
      <motion.path
        d={linePath}
        fill="none"
        stroke="var(--color-accent-strong)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      />
      {xs.map((x, i) => (
        <motion.circle
          key={i}
          cx={x}
          cy={ys[i]}
          r="3.5"
          fill="var(--color-accent-strong)"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.9 + i * 0.03 }}
        />
      ))}
    </svg>
  )
}
