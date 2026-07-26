import { motion } from 'framer-motion'
import type { Stage } from '../types'

const STAGES: { key: Stage; label: string; subItems: string[] }[] = [
  {
    key: 'reading',
    label: 'Lendo vídeo',
    subItems: ['Extraindo Frames', 'Áudio', 'Transcrição'],
  },
  {
    key: 'interpreting',
    label: 'Interpretando Criativo',
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
    <div className="max-w-lg w-full mx-auto space-y-8">
      {STAGES.map((s, i) => {
        const isDone = i < currentIndex
        const isActive = i === currentIndex
        return (
          <div key={s.key} className={isActive || isDone ? 'opacity-100' : 'opacity-40'}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-medium">{s.label}</span>
              {isDone && <span className="text-accent text-sm">Concluído</span>}
            </div>
            <div className="h-1.5 rounded-full bg-line overflow-hidden">
              <motion.div
                className="h-full bg-accent rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: isDone ? '100%' : isActive ? '70%' : '0%' }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            {isActive && (
              <div className="mt-3 flex flex-wrap gap-2">
                {s.subItems.map((item) => (
                  <span
                    key={item}
                    className="text-xs rounded-full bg-accent-soft text-accent px-3 py-1"
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      })}
      <p className="text-center text-sm text-ink-soft">{detail}</p>
    </div>
  )
}
