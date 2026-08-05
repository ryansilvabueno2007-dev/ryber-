import { useEffect, useState } from 'react'

interface Props {
  value: number
  suffix?: string
  duration?: number
}

// Conta de 0 até o valor real ao montar — só efeito visual, o número final é sempre
// o dado real vindo da API, nunca inventado.
export function AnimatedNumber({ value, suffix = '', duration = 800 }: Props) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    let raf: number
    const start = performance.now()
    function tick(now: number) {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(value * eased))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <>
      {display}
      {suffix}
    </>
  )
}
