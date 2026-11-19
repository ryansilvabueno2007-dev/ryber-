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
