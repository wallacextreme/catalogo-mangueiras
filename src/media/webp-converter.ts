/**
 * src/media/webp-converter.ts
 * Conversor Client-Side de Imagens para WebP com fundo branco (#FFFFFF),
 * verificação de Magic Bytes de segurança (Gate 9) e hash SHA-256 para deduplicação (Gate 4).
 */

export interface ConvertedWebPResult {
  webpBlob: Blob;
  dataUrl: string;
  sha256: string;
  width: number;
  height: number;
  thumbDataUrl: string;
}

/**
 * Valida Magic Bytes dos formatos de imagem suportados (Gate 9 - Segurança Anti-XSS).
 */
export function validateMagicBytes(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) return false;
  const bytes = new Uint8Array(buffer.slice(0, 12));

  // PNG: 89 50 4E 47
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  // JPEG: FF D8 FF
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  // WEBP: RIFF .... WEBP
  const isWebP = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
                 bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  // GIF: GIF87a ou GIF89a
  const isGif = bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38;

  return isPng || isJpeg || isWebP || isGif;
}

/**
 * Calcula o hash SHA-256 do buffer para integridade e deduplicação inviolável.
 */
export async function computeSHA256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Converte qualquer imagem colada (Ctrl+V) ou arrastada para WebP Estúdio #FFFFFF.
 */
export async function convertBlobToStudioWebP(
  source: Blob | File,
  quality = 0.96
): Promise<ConvertedWebPResult> {
  const arrayBuffer = await source.arrayBuffer();

  // 1. Validação de segurança via Magic Bytes
  if (!validateMagicBytes(arrayBuffer)) {
    throw new Error('Arquivo inválido: Formato de imagem não suportado ou corrompido.');
  }

  // 2. Hash SHA-256 do arquivo original
  const sha256 = await computeSHA256(arrayBuffer);

  // 3. Renderização no Canvas HTML5 com fundo branco puro #FFFFFF
  const imgBitmap = await createImageBitmap(new Blob([arrayBuffer]));
  const origW = imgBitmap.width;
  const origH = imgBitmap.height;

  // Limite máximo de 1600px para preservar altíssima nitidez sem inflar memória
  let targetW = origW;
  let targetH = origH;
  const maxDim = 1600;
  if (origW > maxDim || origH > maxDim) {
    if (origW > origH) {
      targetW = maxDim;
      targetH = Math.round((origH * maxDim) / origW);
    } else {
      targetH = maxDim;
      targetW = Math.round((origW * maxDim) / origH);
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Falha ao inicializar contexto 2D do Canvas.');
  }

  // Fundo branco puro #FFFFFF para compor transparências
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetW, targetH);
  ctx.drawImage(imgBitmap, 0, 0, targetW, targetH);

  // Exportação WebP de alta qualidade (0.96)
  const webpBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Falha na codificação WebP do canvas.'));
      },
      'image/webp',
      quality
    );
  });

  const dataUrl = canvas.toDataURL('image/webp', quality);

  // Geração de miniatura ultrarrápida (320px) para rolagem fluida
  const thumbW = 320;
  const thumbH = Math.round((targetH * thumbW) / targetW);
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = thumbW;
  thumbCanvas.height = thumbH;
  const thumbCtx = thumbCanvas.getContext('2d');
  let thumbDataUrl = dataUrl;
  if (thumbCtx) {
    thumbCtx.fillStyle = '#FFFFFF';
    thumbCtx.fillRect(0, 0, thumbW, thumbH);
    thumbCtx.drawImage(canvas, 0, 0, thumbW, thumbH);
    thumbDataUrl = thumbCanvas.toDataURL('image/webp', 0.90);
  }

  return {
    webpBlob,
    dataUrl,
    sha256,
    width: targetW,
    height: targetH,
    thumbDataUrl
  };
}
