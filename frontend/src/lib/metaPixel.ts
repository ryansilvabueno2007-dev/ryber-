// Wrapper pro Meta Pixel (fbq) carregado no index.html.
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

export function trackPixelEvent(eventName: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !window.fbq) return
  window.fbq('track', eventName, params ?? {})
}

// Chave do sessionStorage usada pra carregar o plano/valor escolhido no clique de
// "Assinar" (PlanCard) até a tela de sucesso (BillingSuccess), sobrevivendo ao
// redirect externo pra Asaas e volta — sem precisar de nenhuma mudança no backend.
export const CHECKOUT_INTENT_KEY = 'ryber_checkout_intent'
