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
  element.classList.add('pdf-light')
  let canvas: HTMLCanvasElement
  try {
    canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      backgroundColor: '#ffffff',
    })
  } finally {
    element.classList.remove('pdf-light')
  }

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  const imgWidth = pageWidth
  const maxPxPerPage = (canvas.width * pageHeight) / imgWidth
  let renderedPx = 0
  let pageIndex = 0

  while (renderedPx < canvas.height) {
    let sliceEnd = Math.min(renderedPx + maxPxPerPage, canvas.height)

    // Se o corte cai no meio de um bloco marcado, empurra o corte pra antes dele
    // — a menos que o bloco sozinho já seja maior que uma página inteira, aí não
    // tem como evitar (deixa cortar, é melhor que gerar uma página em branco).
    const splitting = blockBoundaries.find(
      (b) => b.top > renderedPx && b.top < sliceEnd && b.bottom > sliceEnd
    )
    if (splitting && splitting.bottom - splitting.top <= maxPxPerPage) {
      sliceEnd = splitting.top
    }

    const sliceHeightPx = sliceEnd - renderedPx

    const pageCanvas = document.createElement('canvas')
    pageCanvas.width = canvas.width
    pageCanvas.height = sliceHeightPx
    const ctx = pageCanvas.getContext('2d')!
    ctx.drawImage(canvas, 0, -renderedPx)

    const sliceImg = pageCanvas.toDataURL('image/jpeg', 0.92)
    const sliceHeightPt = (sliceHeightPx * imgWidth) / canvas.width

    if (pageIndex > 0) pdf.addPage()
    pdf.addImage(sliceImg, 'JPEG', 0, 0, imgWidth, sliceHeightPt)

    renderedPx += sliceHeightPx
    pageIndex += 1
  }

  pdf.save(filename)
}
