/**
 * Preprocesa una imagen para mejorar la lectura de texto manuscrito:
 * la pasa a escala de grises y estira el contraste (normaliza el rango
 * de luminancia entre el mínimo y el máximo reales de la imagen).
 * Esto ayuda mucho con fotos de recetas/documentos sacadas con poca luz
 * o con fondo que le resta contraste al texto.
 */
export async function enhanceImageForOCR(file: File): Promise<File> {
  const image = await loadImage(file);

  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d');
  if (!context) return file;

  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let min = 255;
  let max = 0;
  const gray = new Uint8ClampedArray(data.length / 4);

  for (let i = 0, j = 0; i < data.length; i += 4, j += 1) {
    const value = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray[j] = value;
    if (value < min) min = value;
    if (value > max) max = value;
  }

  const range = Math.max(max - min, 1);

  for (let i = 0, j = 0; i < data.length; i += 4, j += 1) {
    const stretched = ((gray[j] - min) / range) * 255;
    data[i] = stretched;
    data[i + 1] = stretched;
    data[i + 2] = stretched;
  }

  context.putImageData(imageData, 0, 0);

  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b as Blob), 'image/jpeg', 0.92),
  );

  return new File([blob], file.name.replace(/\.\w+$/, '-mejorada.jpg'), {
    type: 'image/jpeg',
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(error);
    };
    img.src = url;
  });
}

/**
 * Genera una vista previa persistente y liviana del documento original.
 *
 * Importante: NO usar URL.createObjectURL para esto. Las blob: URL solo viven
 * mientras dura la pestaña, así que al guardarlas en localStorage y refrescar
 * la página las imágenes quedan rotas. Un data URL redimensionado sobrevive
 * al reload y ocupa poco, que importa porque localStorage ronda los 5 MB.
 */
export async function makeStorablePreview(file: File, maxSize = 1000): Promise<string> {
  const image = await loadImage(file);

  const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.naturalWidth * scale);
  canvas.height = Math.round(image.naturalHeight * scale);

  const context = canvas.getContext('2d');
  if (!context) throw new Error('No se pudo generar la vista previa.');

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.7);
}
