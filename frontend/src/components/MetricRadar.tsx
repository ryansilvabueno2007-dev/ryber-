import type { ObjectiveFitLevel, PerformanceMetricNote } from '../types'

/* Radar das 7 métricas de tráfego pago — SVG puro, sem dependência externa.
   Cada nível vira um raio (fraco=1, bom=2, otimo=3); o polígono resultante dá a
   "forma" do criativo de um relance: quanto mais cheio, mais saudável. */

const LEVEL_VALUE: Record<ObjectiveFitLevel, number> = { fraco: 1, bom: 2, otimo: 3 }

const LEVEL_DOT: Record<ObjectiveFitLevel, string> = {
  otimo: 'fill-success',
  bom: 'fill-accent',
  fraco: 'fill-danger',
}

const CX = 130
const CY = 120
const R = 78
const LABEL_R = R + 24

function polar(index: number, total: number, radius: number): [number, number] {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total
  return [CX + radius * Math.cos(angle), CY + radius * Math.sin(angle)]
}

function ringPoints(total: number, radius: number): string {
  return Array.from({ length: total }, (_, i) => polar(i, total, radius).join(',')).join(' ')
}

export function MetricRadar({ breakdown }: { breakdown: PerformanceMetricNote[] }) {
  if (breakdown.length < 3) return null
  const n = breakdown.length

  const valuePoints = breakdown
    .map((m, i) => polar(i, n, (LEVEL_VALUE[m.level] / 3) * R).join(','))
    .join(' ')

  return (
    <div
      data-pdf-block
      className="rounded-2xl border border-line bg-panel p-5 shadow-card shadow-card-hover transition-all duration-300 hover:border-white/[0.14]"
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-1">
        Mapa das métricas
      </div>
      <p className="text-xs text-ink-soft leading-relaxed mb-3">
        Quanto mais preenchido, mais saudável o criativo em cada métrica.
      </p>

      <div className="flex items-center justify-center">
        <svg viewBox="0 0 260 240" className="w-full max-w-[240px]" role="img" aria-label="Radar das métricas de performance">
          {/* anéis de referência */}
          {[1, 2, 3].map((ring) => (
            <polygon
              key={ring}
              points={ringPoints(n, (ring / 3) * R)}
              className="fill-none stroke-line"
              strokeWidth="1"
            />
          ))}
          {/* raios */}
          {breakdown.map((m, i) => {
            const [x, y] = polar(i, n, R)
            return <line key={m.metric} x1={CX} y1={CY} x2={x} y2={y} className="stroke-line" strokeWidth="1" />
          })}
          {/* polígono do criativo */}
          <polygon points={valuePoints} className="fill-accent/15 stroke-accent" strokeWidth="2" strokeLinejoin="round" />
          {/* pontos por métrica, coloridos por nível */}
          {breakdown.map((m, i) => {
            const [x, y] = polar(i, n, (LEVEL_VALUE[m.level] / 3) * R)
            return <circle key={m.metric} cx={x} cy={y} r="4" className={LEVEL_DOT[m.level]} />
          })}
          {/* rótulos */}
          {breakdown.map((m, i) => {
            const [x, y] = polar(i, n, LABEL_R)
            const anchor = Math.abs(x - CX) < 12 ? 'middle' : x > CX ? 'start' : 'end'
            return (
              <text
                key={m.metric}
                x={x}
                y={y + 3}
                textAnchor={anchor}
                className="fill-ink-soft"
                style={{ fontSize: 10, fontWeight: 600 }}
              >
                {m.metric}
              </text>
            )
          })}
        </svg>
      </div>

      <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-line text-[11px] text-ink-soft">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success" /> Ótimo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Bom
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-danger" /> Fraco
        </span>
      </div>
    </div>
  )
}
