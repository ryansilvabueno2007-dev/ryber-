export function CompareCostModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-md rounded-2xl border border-line bg-panel p-6 shadow-glow">
        <div className="text-sm font-semibold text-ink tracking-tight mb-1.5">Comparar com nova versão</div>
        <p className="text-sm text-ink-soft leading-relaxed mb-6">
          Enviar uma nova versão pra comparar consome <strong className="text-ink">1 análise do seu plano</strong>,
          do mesmo jeito que uma análise nova.
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-line text-ink-soft hover:text-ink px-4 py-2.5 text-sm font-medium transition-all"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-full bg-accent text-white px-4 py-2.5 text-sm font-medium shadow-glow hover:bg-accent-strong transition-all"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  )
}
