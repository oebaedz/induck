import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

export interface PdfExportOptions {
  fileName: string;
  onProgress?: (message: string) => void;
}

/**
 * Renders an HTML element onto high-resolution canvas and saves it as an A4 PDF document.
 * Automatically handles multi-page splitting if the document exceeds single-page A4 height.
 */
export async function downloadElementAsPdf(
  element: HTMLElement,
  options: PdfExportOptions
): Promise<void> {
  const { fileName, onProgress } = options;

  onProgress?.('Menyiapkan dokumen & aset grafik...');

  // Render element to high-res canvas (scale 2 for retina / high-DPI crisp print lines)
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
  });

  onProgress?.('Mengonversi ke format PDF A4...');

  const imgWidth = 210; // Standard A4 width in mm
  const pageHeight = 297; // Standard A4 height in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  let heightLeft = imgHeight;
  let page = 0;

  // Add first page
  pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
  heightLeft -= pageHeight;
  page++;

  // Add subsequent pages if document height exceeds single A4 page
  while (heightLeft > 5) {
    onProgress?.(`Menyusun halaman ${page + 1}...`);
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, -(page * pageHeight), imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;
    page++;
  }

  onProgress?.('Mengunduh file PDF...');
  const sanitizedFileName = fileName
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, '_');

  pdf.save(sanitizedFileName.endsWith('.pdf') ? sanitizedFileName : `${sanitizedFileName}.pdf`);
}
