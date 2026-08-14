/** Formata uma data (YYYY-MM-DD ou ISO com horário) no padrão pt-BR.
 *
 * Datas "só dia" (sem horário) são interpretadas pelo Date() nativo do
 * JavaScript como meia-noite UTC — em fusos atrás de UTC (todo o Brasil),
 * isso exibe um dia a menos do que o real (ex: "2026-10-05" vira "04 de
 * out."). Extrai ano/mês/dia direto da string e monta a data em horário
 * local (construtor de 3 argumentos do Date), sem passar pela conversão
 * de fuso que causa o problema. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return '—'
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}
