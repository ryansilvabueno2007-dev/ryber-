import { motion } from 'framer-motion'
import type { Stage } from '../types'

const STAGES: { key: Stage; label: string; subItems: string[] }[] = [
  {
    key: 'reading',
    label: 'Lendo vídeo',
    subItems: ['Extraindo frames', 'Áudio', 'Transcrição'],
  },
  {
    key: 'interpreting',
    label: 'Interpretando criativo',
    subItems: ['Produto', 'Material', 'Público', 'Posicionamento', 'Benefícios', 'Contexto'],
  },
  {
    key: 'building',
    label: 'Construindo representação',
    subItems: ['Compatibilidade com briefing', 'Alertas', 'Narrativa'],
  },
]

const ORDER: Stage[] = ['reading', 'interpreting', 'building', 'done']

export function StageProgress({ stage, detail }: { stage: Stage; detail: string }) {
  const currentIndex = ORDER.indexOf(stage)

  return (
    <div className="max-w-lg w-full mx-auto">
      <div className="flex items-center gap-2 justify-center mb-10">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-accent">
          Ryber Intelligence trabalhando
        </span>
      </div>

      <div className="space-y-7">
        {STAGES.map((s, i) => {
          const isDone = i < currentIndex
          const isActive = i === currentIndex
          return (
            <div key={s.key} className={`transition-opacity duration-500 ${isActive || isDone ? 'opacity-100' : 'opacity-35'}`}>
              <div className="flex items-center justify-between mb-2.5">
                <span className={`text-sm font-medium ${isActive ? 'text-ink' : 'text-ink-soft'}`}>{s.label}</span>
                {isDone && (
                  <span className="flex items-center gap-1 text-success text-xs font-medium">
                    <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
                      <path d="M4 10.5 8 14.5 16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Concluído
                  </span>
                )}
                {isActive && <span className="text-accent text-xs font-medium tabular-nums">em andamento</span>}
              </div>
              <div className="h-1 rounded-full bg-line overflow-hidden relative">
                <motion.div
                  className="h-full bg-gradient-to-r from-accent to-blue rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: isDone ? '100%' : isActive ? '65%' : '0%' }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                />
                {isActive && (
                  <motion.div
                    className="absolute inset-y-0 w-1/3 bg-white/25 blur-[2px]"
                    animate={{ x: ['-40%', '160%'] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
              </div>
              {isActive && (
                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  {s.subItems.map((item, idx) => (
                    <motion.span
                      key={item}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.06, duration: 0.35 }}
                      className="text-xs rounded-full border border-accent-line bg-accent-soft text-accent px-3 py-1 font-medium"
                    >
                      {item}
                    </motion.span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <p className="text-center text-sm text-ink-faint mt-10">{detail}</p>
    </div>
  )
}
