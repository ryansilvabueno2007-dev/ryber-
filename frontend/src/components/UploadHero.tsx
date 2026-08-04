import { useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface Props {
  onSubmit: (input: { file?: File; link?: string; briefing?: string }) => void
}

export function UploadHero({ onSubmit }: Props) {
  const [dragActive, setDragActive] = useState(false)
  const [link, setLink] = useState('')
  const [briefing, setBriefing] = useState('')
  const [showBriefing, setShowBriefing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    onSubmit({ file, briefing: briefing || undefined })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  function handleLinkSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (link.trim()) onSubmit({ link: link.trim(), briefing: briefing || undefined })
  }

  return (
    <div className="max-w-xl w-full mx-auto space-y-5">
      <motion.div
        onDragOver={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        animate={{
          borderColor: dragActive ? 'var(--color-accent)' : 'rgba(255,255,255,0.12)',
          scale: dragActive ? 1.01 : 1,
        }}
        className="relative rounded-3xl border-2 border-dashed glass p-12 text-center cursor-pointer shadow-elevated overflow-hidden"
        onClick={() => inputRef.current?.click()}
      >
        {dragActive && <div className="absolute inset-0 bg-accent-soft/60 pointer-events-none" />}
        <input
          ref={inputRef}
          type="file"
          accept="video/*,image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
        <div className="relative mx-auto mb-5 h-14 w-14 rounded-2xl border border-accent-line bg-accent-soft flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-accent">
            <path
              d="M12 15V4m0 0 4 4m-4-4-4 4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="relative text-2xl font-medium mb-2 text-ink tracking-tight">Analisar Criativo</div>
        <p className="relative text-ink-soft mb-6">Arraste um vídeo ou uma imagem, ou escolha um arquivo</p>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          className="relative rounded-full bg-accent text-white px-6 py-3 font-medium shadow-glow"
        >
          Escolher arquivo
        </motion.button>
      </motion.div>

      <form onSubmit={handleLinkSubmit} className="flex gap-2">
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Ou cole um link"
          className="flex-1 rounded-full border border-line bg-panel px-5 py-3 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-shadow"
        />
        <button
          type="submit"
          className="rounded-full border border-line px-5 py-3 text-sm font-medium text-ink-soft hover:border-accent hover:text-accent transition-colors"
        >
          Analisar
        </button>
      </form>

      <div>
        <button
          type="button"
          onClick={() => setShowBriefing((v) => !v)}
          className="text-sm text-ink-soft hover:text-ink underline underline-offset-2"
        >
          {showBriefing ? 'Remover briefing' : 'Adicionar briefing (opcional)'}
        </button>
        {showBriefing && (
          <textarea
            value={briefing}
            onChange={(e) => setBriefing(e.target.value)}
            placeholder={'Produto Premium\nCouro\nMulheres 45+\nConforto\nDurabilidade'}
            rows={4}
            className="mt-3 w-full rounded-2xl border border-line bg-panel px-4 py-3 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-accent"
          />
        )}
      </div>
    </div>
  )
}
