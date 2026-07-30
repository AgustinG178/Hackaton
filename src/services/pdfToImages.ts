import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export interface PdfPageImage {
  dataUrl: string;
  file: File;
}

/**
 * Convierte las primeras `maxPages` páginas de un PDF en imágenes JPEG.
 * Gemma (vía Ollama) no acepta PDFs directamente, solo imágenes rasterizadas,
 * así que esto permite reusar el mismo flujo de extracción por imagen.
 */
export async function pdfFileToImages(file: File, maxPages = 3): Promise<PdfPageImage[]> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pageCount = Math.min(pdf.numPages, maxPages);
  const results: PdfPageImage[] = [];

  for (let i = 1; i <= pageCount; i += 1) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d');
    if (!context) continue;

    await page.render({ canvasContext: context, viewport }).promise;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b as Blob), 'image/jpeg', 0.85),
    );

    results.push({
      dataUrl,
      file: new File([blob], `${file.name.replace(/\.pdf$/i, '')}-p${i}.jpg`, {
        type: 'image/jpeg',
      }),
    });
  }

  return results;
}
