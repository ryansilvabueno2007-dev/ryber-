export async function exportElementToPdf(element: HTMLElement, filename: string): Promise<void> {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas-pro'),
    import('jspdf'),
  ])

  const scale = 2

  // Limites verticais (em pixels do canvas final) de cada card/bloco que não pode
  // ser cortado ao meio — medidos antes da captura, já que só mudamos cor (tema
  // claro pra impressão), não layout, então a geometria não muda.
  const containerTop = element.getBoundingClientRect().top
  const blockBoundaries = Array.from(element.querySelectorAll<HTMLElement>('[data-pdf-block]'))
    .map((el) => {
      const r = el.getBoundingClientRect()
      return { top: (r.top - containerTop) * scale, bottom: (r.bottom - containerTop) * scale }
    })
    .sort((a, b) => a.top - b.top)

  // Fundo branco/texto preto na exportação — mesmo com o app em tema escuro na
  // tela, o PDF fica no formato tradicional de documento, melhor pra imprimir.
  // pdf-freeze trava qualquer transição/animação CSS em andamento (ex: o círculo de
  // score anima o preenchimento em 0.9s ao carregar — sem isso, capturar rápido
  // demais pega o círculo pela metade). Espera as fontes carregarem antes de
  // capturar, senão o texto pode medir errado com a fonte de fallback.
  element.classList.add('pdf-light', 'pdf-freeze')
  await document.fonts.ready
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

  let canvas: HTMLCanvasElement
  try {
    canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      backgroundColor: '#ffffff',
    })
  } finally {
    element.classList.remove('pdf-light', 'pdf-freeze')
  }

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  // Margens de verdade — sem isso o conteúdo vai de ponta a ponta na página, o que
  // parece print de tela, não um relatório. Reserva uma faixa extra embaixo pro
  // rodapé (número de página).
  const marginX = 40
  const marginTop = 40
  const footerHeight = 24
  const marginBottom = 40 + footerHeight

  const imgWidth = pageWidth - marginX * 2
  const usableHeight = pageHeight - marginTop - marginBottom
  const maxPxPerPage = (canvas.width * usableHeight) / imgWidth

  // Calcula todos os cortes de página com a mesma regra de "não quebrar bloco" antes
  // de desenhar qualquer página — assim o rodapé mostra o total real (a conta ingênua
  // canvas.height / maxPxPerPage não bate quando blocos empurram conteúdo pra página
  // seguinte, sobrando espaço em branco).
  const sliceEnds: number[] = []
  {
    let cursor = 0
    while (cursor < canvas.height) {
      let sliceEnd = Math.min(cursor + maxPxPerPage, canvas.height)
      const splitting = blockBoundaries.find((b) => b.top > cursor && b.top < sliceEnd && b.bottom > sliceEnd)
      if (splitting && splitting.bottom - splitting.top <= maxPxPerPage) {
        sliceEnd = splitting.top
      }
      sliceEnds.push(sliceEnd)
      cursor = sliceEnd
    }
  }
  const totalPages = sliceEnds.length

  let renderedPx = 0
  let pageIndex = 0

  for (const sliceEnd of sliceEnds) {
    const sliceHeightPx = sliceEnd - renderedPx

    const pageCanvas = document.createElement('canvas')
    pageCanvas.width = canvas.width
    pageCanvas.height = sliceHeightPx
    const ctx = pageCanvas.getContext('2d')!
    ctx.drawImage(canvas, 0, -renderedPx)

    const sliceImg = pageCanvas.toDataURL('image/jpeg', 0.92)
    const sliceHeightPt = (sliceHeightPx * imgWidth) / canvas.width

    if (pageIndex > 0) pdf.addPage()
    pdf.addImage(sliceImg, 'JPEG', marginX, marginTop, imgWidth, sliceHeightPt)

    pdf.setFontSize(9)
    pdf.setTextColor(150)
    pdf.text('Ryber', marginX, pageHeight - marginBottom + footerHeight)
    pdf.text(
      `Página ${pageIndex + 1} de ${totalPages}`,
      pageWidth - marginX,
      pageHeight - marginBottom + footerHeight,
      { align: 'right' }
    )

    renderedPx = sliceEnd
    pageIndex += 1
  }

  pdf.save(filename)
}
