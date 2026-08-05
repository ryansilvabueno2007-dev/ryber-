import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  onSubmit: (input: { file?: File; link?: string; briefing?: string }) => void
}

const ALLOWED_LINK_DOMAINS = ['instagram.com', 'facebook.com', 'fb.watch', 'tiktok.com']

function isAllowedLink(value: string): boolean {
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase()
    return ALLOWED_LINK_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))
  } catch {
    return false
  }
}

function UploadIcon() {
  return (
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
  )
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-accent">
      <path
        d="M9.5 14.5 14.5 9.5M8 12.5l-2 2a3 3 0 1 0 4.24 4.24l2-2M16 11.5l2-2a3 3 0 1 0-4.24-4.24l-2 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function UploadHero({ onSubmit }: Props) {
  const [mode, setMode] = useState<'file' | 'link'>('file')
  const [dragActive, setDragActive] = useState(false)
  const [link, setLink] = useState('')
  const [linkError, setLinkError] = useState<string | null>(null)
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
    const trimmed = link.trim()
    if (!trimmed) return
    if (!isAllowedLink(trimmed)) {
      setLinkError('Esse link não é suportado. A Ryber aceita apenas links do Instagram, Facebook ou TikTok.')
      return
    }
    setLinkError(null)
    onSubmit({ link: trimmed, briefing: briefing || undefined })
  }

  return (
    <div className="max-w-2xl w-full mx-auto">
      <div className="relative rounded-3xl glass shadow-elevated overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

        <div className="relative flex border-b border-line">
          <button
            type="button"
            onClick={() => setMode('file')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors ${
              mode === 'file' ? 'text-ink border-b-2 border-accent -mb-px' : 'text-ink-faint hover:text-ink-soft'
            }`}
          >
            <UploadIcon />
            Enviar arquivo
          </button>
          <button
            type="button"
            onClick={() => setMode('link')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors ${
              mode === 'link' ? 'text-ink border-b-2 border-accent -mb-px' : 'text-ink-faint hover:text-ink-soft'
            }`}
          >
            <LinkIcon />
            Colar link
          </button>
        </div>

        <div className="relative p-8 sm:p-10">
          <AnimatePresence mode="wait">
            {mode === 'file' ? (
              <motion.div
                key="file"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
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
                  className="relative rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer overflow-hidden"
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
                    <UploadIcon />
                  </div>
                  <div className="relative text-xl font-medium mb-1.5 text-ink tracking-tight">
                    Arraste um vídeo ou imagem
                  </div>
                  <p className="relative text-ink-soft text-sm mb-6">ou escolha um arquivo do seu computador</p>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    className="relative rounded-full bg-accent text-white px-6 py-3 text-sm font-medium shadow-glow"
                  >
                    Escolher arquivo
                  </motion.button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="link"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <form onSubmit={handleLinkSubmit} className="space-y-4">
                  <div>
                    <div className="mx-auto mb-5 h-14 w-14 rounded-2xl border border-accent-line bg-accent-soft flex items-center justify-center">
                      <LinkIcon />
                    </div>
                    <input
                      value={link}
                      onChange={(e) => {
                        setLink(e.target.value)
                        if (linkError) setLinkError(null)
                      }}
                      placeholder="https://www.instagram.com/reel/..."
                      className="w-full rounded-full border border-line bg-panel px-5 py-3.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-shadow"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2 text-[11px] text-ink-faint">
                    <span>Suportado hoje:</span>
                    <span className="font-medium text-ink-soft">Instagram, Facebook e TikTok</span>
                  </div>
                  {linkError && <p className="text-danger text-xs text-center">{linkError}</p>}
                  <button
                    type="submit"
                    className="w-full rounded-full bg-accent text-white px-6 py-3.5 text-sm font-medium shadow-glow hover:bg-accent-strong transition-all"
                  >
                    Analisar link
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setShowBriefing((v) => !v)}
              className="text-xs text-ink-faint hover:text-ink-soft underline underline-offset-2"
            >
              {showBriefing ? 'Remover briefing' : 'Adicionar briefing (opcional)'}
            </button>
            {showBriefing && (
              <textarea
                value={briefing}
                onChange={(e) => setBriefing(e.target.value)}
                placeholder={'Produto Premium\nCouro\nMulheres 45+\nConforto\nDurabilidade'}
                rows={4}
                className="mt-3 w-full rounded-2xl border border-line bg-panel px-4 py-3 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-accent text-left"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
