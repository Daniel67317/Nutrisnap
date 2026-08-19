/* ── Preparación de imágenes ───────────────────────────────────────────────
   El riesgo silencioso del analizador: una foto de móvil son 3-8 MB. En
   base64 crece un 33% más. localStorage da ~5 MB EN TOTAL. Guardar dos fotos
   sin tocar llena la cuota y a partir de ahí la app deja de persistir nada,
   sin avisar.

   Todo lo que entra al analizador pasa antes por aquí: se reduce el lado
   mayor a 720 px y se recomprime a JPEG. Resultado típico: 40-90 KB. Suficiente
   resolución para un modelo de visión y ~50 veces más barato de almacenar.
   ------------------------------------------------------------------------ */

export interface PreparedImage {
  /** JPEG en base64, listo para mostrar, guardar o enviar a la API. */
  dataUrl: string;
  /** Dimensiones YA redimensionadas. Las cajas del detector se calculan
      sobre estas, no sobre el original. */
  width: number;
  height: number;
  approxKb: number;
}

const MAX_EDGE = 720;
const QUALITY = 0.72;

/** Carga un File/Blob a un bitmap, con camino alternativo para Safari viejo. */
async function toBitmap(source: Blob): Promise<{
  draw: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
}> {
  if (typeof createImageBitmap === 'function') {
    // `imageOrientation: 'from-image'` es obligatorio. Sin él se ignora la
    // etiqueta EXIF y CUALQUIER foto tomada en vertical con el móvil sale
    // girada 90°, porque el sensor siempre captura en horizontal y delega
    // la rotación en los metadatos.
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(source, { imageOrientation: 'from-image' });
    } catch {
      // Safari antiguo no acepta el objeto de opciones.
      bitmap = await createImageBitmap(source);
    }
    return {
      draw: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      release: () => bitmap.close(),
    };
  }

  const url = URL.createObjectURL(source);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('No pudimos leer la imagen.'));
    img.src = url;
  });
  return {
    draw: img,
    width: img.naturalWidth,
    height: img.naturalHeight,
    release: () => URL.revokeObjectURL(url),
  };
}

export async function prepareImage(source: Blob): Promise<PreparedImage> {
  const { draw, width, height, release } = await toBitmap(source);

  try {
    // Nunca ampliamos: una foto pequeña se queda como está.
    const scale = Math.min(MAX_EDGE / Math.max(width, height), 1);
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No pudimos procesar la imagen en este navegador.');

    ctx.drawImage(draw, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);

    return {
      dataUrl,
      width: w,
      height: h,
      // base64 son 4 caracteres por cada 3 bytes.
      approxKb: Math.round((dataUrl.length * 0.75) / 1024),
    };
  } finally {
    release();
  }
}
