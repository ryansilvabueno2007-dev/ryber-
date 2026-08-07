export interface Plan {
  id: string
  name: string
  price: number
  quota: string
}

export const PLANS: Plan[] = [
  { id: 'start', name: 'Ryber Start', price: 69.9, quota: '10 análises profissionais de criativos por mês' },
  { id: 'gold', name: 'Ryber Gold', price: 189.9, quota: '30 análises profissionais de criativos por mês' },
  { id: 'platinum', name: 'Ryber Platinum', price: 379.9, quota: '60 análises profissionais de criativos por mês' },
  { id: 'titanium', name: 'Ryber Titanium', price: 629.9, quota: '100 análises profissionais de criativos por mês' },
  { id: 'infinity', name: 'Ryber Infinity', price: 1599.9, quota: '300 análises profissionais de criativos por mês' },
]

export const PLAN_FEATURES = [
  'Avaliação completa da capacidade de conversão do anúncio',
  'Como o algoritmo das plataformas interpreta seu criativo para encontrar o público e como o público tende a reagir ao seu conteúdo',
  'Plano de otimização por cena, com sugestões específicas para cada trecho do vídeo de acordo com seu objetivo de conversão',
  'Diagnóstico orientado para CTR, Hook Rate, Hold Rate, CPA, ROAS, entre outros',
  'Comparação com os melhores criativos do seu segmento e o que funciona nele',
  'Evolução do criativo antes e depois das otimizações feitas',
  'Verificação de alinhamento com o briefing e objetivo da campanha, com recomendações para melhoria',
  'Biblioteca completa com todas as análises realizadas',
]

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
