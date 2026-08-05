import { Link } from 'react-router-dom'

const BENEFITS = [
  'Leitura completa do criativo',
  'Benchmark do nicho',
  'Público identificado',
  'Emoções transmitidas',
  'Posicionamento',
  'Riscos encontrados',
  'Plano de edição cena a cena',
  'Performance prevista',
]

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-accent shrink-0">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function AuthValueProp() {
  return (
    <div className="relative hidden lg:flex flex-col justify-center px-16 py-16 overflow-hidden border-r border-white/[0.06]">
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-accent-soft blur-[100px] pointer-events-none" />
      <div className="relative max-w-md">
        <Link to="/" className="flex items-center gap-2 mb-12 w-fit">
          <img src="/logo-mark.png" alt="" className="h-8 w-8" />
          <span className="font-semibold tracking-tight text-lg text-ink">Ryber</span>
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight mb-5 text-ink leading-tight">
          Descubra como a IA das plataformas de anúncio interpreta seu criativo — e como seu público
          realmente reage a ele.
        </h1>
        <p className="text-ink-soft text-base leading-relaxed mb-10">
          Relatórios completos de performance, público, posicionamento e risco, prontos antes de você
          investir um real em mídia.
        </p>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-3.5">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-center gap-2 text-sm text-ink-soft">
              <CheckIcon />
              {b}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
