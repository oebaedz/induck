import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

export interface PdfExportOptions {
  fileName: string;
  onProgress?: (message: string) => void;
}

/**
 * Renders HTML element(s) onto high-resolution canvas and saves as an official A4 PDF document.
 * 
 * Features:
 * - Detects discrete `.pdf-page` sections for clean, professional page breaks (no arbitrary cuts).
 * - Enforces clean, standard page margins (12mm) on all 4 sides.
 * - Strips any container borders, outlines, or box shadows so no stray lines appear on page edges.
 * - Scales content proportionally to fit within A4 printable boundaries.
 */
export async function downloadElementAsPdf(
  element: HTMLElement,
  options: PdfExportOptions
): Promise<void> {
  const { fileName, onProgress } = options;

  onProgress?.('Menyiapkan dokumen & tata letak...');

  // Standard A4 dimensions in millimeters
  const PAGE_WIDTH_MM = 210;
  const PAGE_HEIGHT_MM = 297;
  const MARGIN_X_MM = 12; // 12mm margin kiri dan kanan
  const MARGIN_Y_MM = 12; // 12mm margin atas dan bawah
  const CONTENT_MAX_WIDTH_MM = PAGE_WIDTH_MM - (MARGIN_X_MM * 2); // 186mm
  const CONTENT_MAX_HEIGHT_MM = PAGE_HEIGHT_MM - (MARGIN_Y_MM * 2); // 273mm

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  // Query for discrete `.pdf-page` elements
  const pageNodes = Array.from(element.querySelectorAll<HTMLElement>('.pdf-page'));
  const pagesToRender: HTMLElement[] = pageNodes.length > 0 ? pageNodes : [element];

  for (let i = 0; i < pagesToRender.length; i++) {
    const pageEl = pagesToRender[i];
    onProgress?.(`Memproses halaman ${i + 1} dari ${pagesToRender.length}...`);

    if (i > 0) {
      pdf.addPage();
    }

    // Capture element with html2canvas-pro
    // We clone and strip any outer border / box-shadow so NO stray line appears on the edge!
    const canvas = await html2canvas(pageEl, {
      scale: 2, // 2x DPI for crisp high-resolution print typography
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc, clonedEl) => {
        // Strip box shadows and borders from the page container and its parents
        clonedEl.style.boxShadow = 'none';
        clonedEl.style.border = 'none';
        clonedEl.style.outline = 'none';
        clonedEl.style.margin = '0';
        clonedEl.style.borderRadius = '0';

        // Also clean any element with .pdf-page or .print-sheet in the clone
        const allPages = clonedDoc.querySelectorAll<HTMLElement>('.pdf-page, .print-sheet');
        allPages.forEach(el => {
          el.style.boxShadow = 'none';
          el.style.border = 'none';
          el.style.outline = 'none';
          el.style.borderRadius = '0';
        });
      },
    });

    // Fallback if someone passed a single tall element without .pdf-page that exceeds 1 page
    if (pageNodes.length === 0) {
      const estimatedHeightMm = (canvas.height * CONTENT_MAX_WIDTH_MM) / canvas.width;
      if (estimatedHeightMm > CONTENT_MAX_HEIGHT_MM) {
        let remainingHeight = estimatedHeightMm;
        let currentSourceY = 0;
        let pageIdx = 0;
        const pxPerMm = canvas.width / CONTENT_MAX_WIDTH_MM;
        const sliceHeightPx = CONTENT_MAX_HEIGHT_MM * pxPerMm;

        while (remainingHeight > 0) {
          if (pageIdx > 0) {
            pdf.addPage();
          }

          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = Math.min(sliceHeightPx, canvas.height - currentSourceY);

          const ctx = sliceCanvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
            ctx.drawImage(
              canvas,
              0, currentSourceY, canvas.width, sliceCanvas.height,
              0, 0, sliceCanvas.width, sliceCanvas.height
            );

            const sliceImgData = sliceCanvas.toDataURL('image/jpeg', 0.96);
            const currentSliceHeightMm = (sliceCanvas.height * CONTENT_MAX_WIDTH_MM) / canvas.width;

            pdf.addImage(
              sliceImgData,
              'JPEG',
              MARGIN_X_MM,
              MARGIN_Y_MM,
              CONTENT_MAX_WIDTH_MM,
              currentSliceHeightMm,
              undefined,
              'FAST'
            );
          }

          currentSourceY += sliceHeightPx;
          remainingHeight -= CONTENT_MAX_HEIGHT_MM;
          pageIdx++;
        }
        break; // Finished rendering the multi-page sliced single container
      }
    }

    const imgData = canvas.toDataURL('image/jpeg', 0.96);

    // Calculate scaling to fit within printable A4 boundaries
    let renderWidth = CONTENT_MAX_WIDTH_MM;
    let renderHeight = (canvas.height * renderWidth) / canvas.width;

    let posX = MARGIN_X_MM;
    let posY = MARGIN_Y_MM;

    // If rendered height exceeds printable height, scale down proportionally so the whole section fits on the page
    if (renderHeight > CONTENT_MAX_HEIGHT_MM) {
      const scaleDownRatio = CONTENT_MAX_HEIGHT_MM / renderHeight;
      renderHeight = CONTENT_MAX_HEIGHT_MM;
      renderWidth = renderWidth * scaleDownRatio;
      posX = MARGIN_X_MM + (CONTENT_MAX_WIDTH_MM - renderWidth) / 2; // Center horizontally
    }

    pdf.addImage(imgData, 'JPEG', posX, posY, renderWidth, renderHeight, undefined, 'FAST');
  }

  onProgress?.('Mengunduh file PDF...');
  const sanitizedFileName = fileName
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, '_');

  pdf.save(sanitizedFileName.endsWith('.pdf') ? sanitizedFileName : `${sanitizedFileName}.pdf`);
}
