import { motion } from 'framer-motion'

export function ProgressBar({ ratio }: { ratio: number }) {
  const pct = Math.max(0, Math.min(1, ratio)) * 100
  return (
    <div className="h-2 w-full rounded-full bg-panel-raised border border-line overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="h-full rounded-full bg-gradient-to-r from-accent to-blue shadow-glow"
      />
    </div>
  )
}
