import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

/**
 * Downloads a high-quality PDF from a specific DOM element.
 * 100% reliable inside iframes, desktop, tablets and mobile.
 * Fully supports modern CSS colors including OKLCH, OKLAB, and LCH.
 */
export async function exportPdfFromElement(element: HTMLElement, filename: string): Promise<boolean> {
  try {
    const canvas = await html2canvas(element, {
      scale: 2, // 2x retina clarity
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1024,
      onclone: (_clonedDoc, clonedElement) => {
        // Remove height/overflow bounds so the entire document is captured
        if (clonedElement) {
          clonedElement.style.maxHeight = 'none';
          clonedElement.style.overflow = 'visible';
          clonedElement.style.height = 'auto';
        }
      },
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 10; // 10mm margins
    const imgWidth = pdfWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
    heightLeft -= (pdfHeight - margin * 2);

    // Multi-page support if statement is long
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - margin * 2);
    }

    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(cleanFilename);
    return true;
  } catch (err) {
    console.error('Error generating PDF from element:', err);
    return false;
  }
}

/**
 * Generates and downloads a PDF directly from HTML string.
 */
export async function exportPdfFromHtml(htmlBody: string, filename: string): Promise<boolean> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.background = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  container.style.padding = '24px';
  container.style.boxSizing = 'border-box';
  container.innerHTML = `
    <style>
      * { box-sizing: border-box; }
      .header-box { border-bottom: 2px solid #0f766e; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; }
      .brand-title { font-size: 20px; font-weight: 900; color: #0f766e; margin: 0; }
      .brand-sub { font-size: 10px; color: #475569; margin-top: 2px; }
      .doc-title { font-size: 16px; font-weight: 800; text-align: right; color: #0f172a; margin: 0; text-transform: uppercase; }
      .doc-meta { font-size: 10px; color: #64748b; text-align: right; margin-top: 2px; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
      .info-col p { margin: 2px 0; font-size: 11px; }
      .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; }
      .summary-card { border: 1px solid #cbd5e1; padding: 8px 10px; border-radius: 6px; background: #ffffff; }
      .summary-card.highlight { background: #f0fdfa; border-color: #99f6e4; }
      .summary-label { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; }
      .summary-value { font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 2px; }
      .summary-sub { font-size: 8.5px; color: #64748b; }
      table.statement-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10.5px; }
      table.statement-table th { background-color: #f1f5f9; color: #334155; text-align: left; padding: 8px 6px; font-weight: 700; border-bottom: 1.5px solid #cbd5e1; text-transform: uppercase; font-size: 9px; }
      table.statement-table td { padding: 7px 6px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
      .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 8.5px; font-weight: 700; text-transform: uppercase; }
      .badge-completed { background: #dcfce7; color: #166534; }
      .badge-escrow { background: #fef3c7; color: #92400e; }
      .footer-seal { margin-top: 20px; padding-top: 12px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; color: #64748b; }
      .seal-box { border: 1.5px solid #0f766e; color: #0f766e; padding: 6px 12px; border-radius: 6px; font-weight: 800; font-size: 10px; text-align: center; text-transform: uppercase; background: #f0fdfa; }
    </style>
    ${htmlBody}
  `;

  document.body.appendChild(container);

  try {
    const success = await exportPdfFromElement(container, filename);
    return success;
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Triggers system print with dedicated print mount
 */
export function triggerSystemPrint(elementToPrint?: HTMLElement | null): void {
  if (elementToPrint) {
    // Mount a clean print clone directly in the DOM
    const printContainer = document.createElement('div');
    printContainer.id = 'active-print-section';
    printContainer.className = 'print-section-active';
    printContainer.innerHTML = elementToPrint.outerHTML;
    document.body.appendChild(printContainer);

    window.focus();
    setTimeout(() => {
      window.print();
      // Clean up after print dialog finishes
      setTimeout(() => {
        if (document.body.contains(printContainer)) {
          document.body.removeChild(printContainer);
        }
      }, 1000);
    }, 100);
  } else {
    window.focus();
    window.print();
  }
}

/**
 * Downloads a standalone HTML document
 */
export function downloadHtmlDocument(htmlBody: string, filename: string, title = 'Statement') {
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 24px;
      font-size: 12px;
      line-height: 1.4;
      max-width: 800px;
      margin: 0 auto;
    }
    .header-box { border-bottom: 2px solid #0f766e; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; }
    .brand-title { font-size: 20px; font-weight: 900; color: #0f766e; margin: 0; }
    .brand-sub { font-size: 10px; color: #475569; margin-top: 2px; }
    .doc-title { font-size: 16px; font-weight: 800; text-align: right; color: #0f172a; margin: 0; text-transform: uppercase; }
    .doc-meta { font-size: 10px; color: #64748b; text-align: right; margin-top: 2px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .info-col p { margin: 2px 0; font-size: 11px; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; }
    .summary-card { border: 1px solid #cbd5e1; padding: 8px 10px; border-radius: 6px; background: #ffffff; }
    .summary-card.highlight { background: #f0fdfa; border-color: #99f6e4; }
    .summary-label { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .summary-value { font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 2px; }
    .summary-sub { font-size: 8.5px; color: #64748b; }
    table.statement-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10.5px; }
    table.statement-table th { background-color: #f1f5f9; color: #334155; text-align: left; padding: 8px 6px; font-weight: 700; border-bottom: 1.5px solid #cbd5e1; font-size: 9px; }
    table.statement-table td { padding: 7px 6px; border-bottom: 1px solid #e2e8f0; }
    .badge-completed { background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 8.5px; }
    .badge-escrow { background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 8.5px; }
    .footer-seal { margin-top: 20px; padding-top: 12px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: flex-end; }
    .seal-box { border: 1.5px solid #0f766e; color: #0f766e; padding: 6px 12px; border-radius: 6px; font-weight: 800; font-size: 10px; text-align: center; text-transform: uppercase; background: #f0fdfa; }
  </style>
</head>
<body>
  ${htmlBody}
  <script>
    window.onload = function() {
      setTimeout(() => window.print(), 300);
    };
  </script>
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
