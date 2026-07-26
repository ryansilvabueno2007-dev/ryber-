import { useRef, useState } from 'react'
import type { TimelineEntry } from '../types'

interface Props {
  src: string
  timeline: TimelineEntry[]
  mediaType: 'video' | 'image'
}

export function MediaTimeline({ src, timeline, mediaType }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [activeT, setActiveT] = useState<number | null>(null)

  function seek(t: number) {
    if (videoRef.current) {
      videoRef.current.currentTime = t
      videoRef.current.play().catch(() => {})
    }
    setActiveT(t)
  }

  return (
    <div className="space-y-4">
      {mediaType === 'video' ? (
        <video
          ref={videoRef}
          src={src}
          controls
          className="w-full rounded-2xl border border-line bg-black aspect-[9/16] max-h-[70vh] object-contain shadow-elevated"
          onTimeUpdate={(e) => setActiveT(e.currentTarget.currentTime)}
        />
      ) : (
        <img
          src={src}
          alt="Criativo analisado"
          className="w-full rounded-2xl border border-line bg-black max-h-[70vh] object-contain shadow-elevated"
        />
      )}

      <div className="rounded-2xl border border-line bg-panel p-4 max-h-72 overflow-y-auto shadow-card">
        <div className="text-xs font-medium uppercase tracking-wide text-ink-soft mb-3">
          {mediaType === 'video' ? 'Timeline' : 'O que a IA viu'}
        </div>
        <ul className="space-y-1">
          {timeline.map((entry) => {
            if (mediaType === 'image') {
              return (
                <li key={entry.t} className="px-3 py-2 text-sm text-ink-soft">
                  {entry.finding}
                </li>
              )
            }
            const isActive =
              activeT !== null && Math.abs(activeT - entry.t) < 1.5 && activeT >= entry.t
            return (
              <li key={entry.t}>
                <button
                  onClick={() => seek(entry.t)}
                  className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive ? 'bg-accent-soft text-accent' : 'hover:bg-canvas text-ink-soft'
                  }`}
                >
                  <span className="font-mono text-xs mr-2 tabular-nums">
                    {Math.floor(entry.t)}s
                  </span>
                  {entry.finding}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
