export async function exportElementToPdf(element: HTMLElement, filename: string): Promise<void> {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas-pro'),
    import('jspdf'),
  ])

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  })

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  const imgWidth = pageWidth
  const pxPerPage = (canvas.width * pageHeight) / imgWidth
  let renderedPx = 0
  let pageIndex = 0

  while (renderedPx < canvas.height) {
    const sliceHeightPx = Math.min(pxPerPage, canvas.height - renderedPx)

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
