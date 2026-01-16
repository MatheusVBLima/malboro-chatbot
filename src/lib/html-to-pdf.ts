// Dynamic imports for bundle size optimization (bundle-dynamic-imports)
// jspdf (~300KB) and html2canvas (~500KB) are only loaded when PDF export is triggered

export interface HtmlToPdfOptions {
  filename?: string;
  format?: "a4" | "letter";
  orientation?: "portrait" | "landscape";
  margin?: number; // Margin in mm
}

/**
 * Converts HTML content to PDF using html2canvas and jsPDF
 * This approach produces high-quality PDFs that preserve all CSS styling
 *
 * @param htmlContent - HTML string to convert
 * @param options - PDF generation options
 * @returns Uint8Array representing the PDF file
 */
export async function htmlToPDF(
  htmlContent: string,
  options?: HtmlToPdfOptions
): Promise<Uint8Array> {
  if (typeof document === "undefined") {
    throw new Error("HTML to PDF conversion must be performed in a browser environment");
  }

  // Dynamic imports - only load heavy libraries when actually needed
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);

  // Create an isolated iframe to prevent HTML content from affecting the main page
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  iframe.style.top = "0";
  iframe.style.width = "1px";
  iframe.style.height = "1px";
  iframe.style.border = "none";
  iframe.style.visibility = "hidden";
  iframe.style.pointerEvents = "none";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error("Failed to create iframe for HTML rendering");
  }

  try {
    // Set up iframe document
    const isLetter = options?.format === "letter";
    const margin = options?.margin ?? 10; // Default 10mm margin
    
    // A4: 210mm = 794px at 96dpi (210 / 25.4 * 96 = 794.33)
    // Letter: 8.5in = 816px at 96dpi
    const pageWidthPx = isLetter ? 816 : 794; // Exact A4 width at 96dpi
    const pageHeightPx = isLetter ? 1056 : 1123; // A4 height at 96dpi (297 / 25.4 * 96 = 1122.52)
    
    // Check if HTML content already has <html> or <body> tags
    const hasHtmlTags = /<html[\s>]|<body[\s>]/i.test(htmlContent);
    
    if (hasHtmlTags) {
      // If HTML already has structure, inject it directly but ensure proper sizing
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();
      
      // Wait for content to load
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Inject additional styles to ensure proper rendering
      const style = iframeDoc.createElement("style");
      style.textContent = `
        html {
          width: ${pageWidthPx}px;
          max-width: ${pageWidthPx}px;
        }
        body {
          width: ${pageWidthPx}px;
          max-width: ${pageWidthPx}px;
          min-width: ${pageWidthPx}px;
          padding: 0 !important;
          margin: 0 !important;
          background: #ffffff !important;
        }
      `;
      iframeDoc.head.appendChild(style);
    } else {
      // If just HTML fragment, wrap it properly
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * {
                box-sizing: border-box;
              }
              body {
                width: ${pageWidthPx}px;
                max-width: ${pageWidthPx}px;
                min-height: ${pageHeightPx}px;
                padding: 0;
                margin: 0;
                background: #ffffff;
              }
            </style>
          </head>
          <body>
            ${htmlContent}
          </body>
        </html>
      `);
      iframeDoc.close();
    }

    // Wait for fonts and images to load
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // Wait for any external resources
    if (iframeDoc.readyState === "loading") {
      await new Promise((resolve) => {
        iframeDoc.addEventListener("DOMContentLoaded", resolve, { once: true });
        setTimeout(resolve, 1000); // Fallback timeout
      });
    }

    // Get body element from iframe
    const bodyElement = iframeDoc.body;
    if (!bodyElement) {
      throw new Error("Failed to access iframe body");
    }

    // Use html2canvas to capture HTML as an image
    // Scale 2 means 2x resolution, so canvas will be 2x size
    const html2canvasScale = 2;
    const canvas = await html2canvas(bodyElement, {
      scale: html2canvasScale, // Higher quality (2x resolution)
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      allowTaint: false,
      windowWidth: pageWidthPx,
      windowHeight: bodyElement.scrollHeight || pageHeightPx,
      letterRendering: true, // Better text rendering
      onclone: (clonedDoc: Document) => {
        // Ensure proper styling in cloned document
        const clonedBody = clonedDoc.body;
        if (clonedBody) {
          clonedBody.style.background = '#ffffff';
        }
      },
    } as any);

    // Get dimensions in mm (for A4) or inches (for Letter)
    const marginInUnit = isLetter ? margin / 25.4 : margin; // Convert mm to inches if Letter
    const pageWidth = isLetter ? 8.5 : 210; // inches or mm
    const pageHeight = isLetter ? 11 : 297; // inches or mm
    const availableWidth = pageWidth - marginInUnit * 2;
    const availableHeight = pageHeight - marginInUnit * 2;

    // Create PDF using jsPDF
    const pdf = new jsPDF({
      orientation: options?.orientation === "landscape" ? "landscape" : "portrait",
      unit: isLetter ? "in" : "mm",
      format: isLetter ? "letter" : "a4",
    });

    // Convert canvas dimensions to PDF units
    // IMPORTANT: canvas is scaled by html2canvasScale (2x), so we need to divide by it
    // to get actual HTML pixel dimensions, then convert to PDF units
    const actualHtmlWidthPx = canvas.width / html2canvasScale;
    const actualHtmlHeightPx = canvas.height / html2canvasScale;
    
    // Convert actual HTML pixels to PDF units (mm or inches)
    // At 96 DPI: 1px = 0.264583mm (1 inch = 25.4mm, 1 inch = 96px, so 1px = 25.4/96 = 0.264583mm)
    const canvasWidthInUnit = isLetter 
      ? actualHtmlWidthPx / 96  // Convert px to inches (1px = 1/96 inch at 96dpi)
      : actualHtmlWidthPx * 0.264583; // Convert px to mm
    const canvasHeightInUnit = isLetter
      ? actualHtmlHeightPx / 96
      : actualHtmlHeightPx * 0.264583;

    // Scale to fit FULL width (no centering, fill entire width minus margins)
    const widthScale = availableWidth / canvasWidthInUnit;
    const scale = widthScale;

    const imgWidth = availableWidth;
    const imgHeight = canvasHeightInUnit * scale;

    // Use availableHeight as max height per page (margins already accounted for)
    const maxContentHeight = availableHeight;

    // Calculate how many pages we need
    const totalPages = Math.ceil(imgHeight / maxContentHeight);

    if (totalPages === 1) {
      // Single page - add image at full width
      const imgData = canvas.toDataURL("image/png", 0.95);
      pdf.addImage(imgData, "PNG", marginInUnit, marginInUnit, imgWidth, imgHeight, undefined, "FAST");
    } else {
      // Multi-page - split content across pages
      // Calculate how much source height corresponds to maxContentHeight
      const sourceHeightForMaxContent = (maxContentHeight / imgHeight) * canvas.height;

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage();
        }

        // Calculate slice for this page
        const sourceY = page * sourceHeightForMaxContent;
        const sourceHeight = Math.min(sourceHeightForMaxContent, canvas.height - sourceY);
        const actualImgHeight = Math.min(maxContentHeight, imgHeight - page * maxContentHeight);

        // Create a canvas for this page slice
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;
        const ctx = pageCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(
            canvas,
            0,
            sourceY,
            canvas.width,
            sourceHeight,
            0,
            0,
            canvas.width,
            sourceHeight
          );
        }

        const pageImgData = pageCanvas.toDataURL("image/png", 0.95);
        pdf.addImage(pageImgData, "PNG", marginInUnit, marginInUnit, imgWidth, actualImgHeight, undefined, "FAST");
      }
    }

    // Clean up
    if (iframe.parentNode) {
      document.body.removeChild(iframe);
    }

    // Convert to Uint8Array
    const pdfBlob = pdf.output("arraybuffer");
    return new Uint8Array(pdfBlob);
  } catch (error: any) {
    // Clean up on error
    if (iframe.parentNode) {
      document.body.removeChild(iframe);
    }
    throw new Error(`Failed to convert HTML to PDF: ${error.message || "Unknown error"}`);
  }
}
