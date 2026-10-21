// DIPLOMA_STORAGE_V1 - resolve only at display/export time, never when saving JSON.
import { storageAssets, type StoredFont } from './storageAssets';

type FontEntry = { font: StoredFont; tag: HTMLStyleElement; ready: Promise<void> };
const fonts = new Map<string, FontEntry>();
function cssString(value: string): string { return JSON.stringify(value).replace(/</g, '\\3c '); }
export function clearFontFaces() {
  for (const item of fonts.values()) item.tag.remove();
  fonts.clear();
}
export function removeFontFace(id: string) {
  fonts.get(id)?.tag.remove();
  fonts.delete(id);
  document.getElementById(`font-${id}`)?.remove();
}
export function registerFont(font: StoredFont): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  if (!font || typeof font.family !== 'string' || !['woff', 'woff2', 'truetype', 'opentype'].includes(font.format)) {
    return Promise.reject(new Error('Los datos de la fuente no son validos.'));
  }
  const previous = fonts.get(font.id);
  if (previous && previous.font.dataUrl === font.dataUrl && previous.font.family === font.family) return previous.ready;
  removeFontFace(font.id);
  const tag = document.createElement('style');
  tag.id = `font-${font.id}`;
  document.head.appendChild(tag);
  const ready = (async () => {
    const url = await storageAssets.displayUrl(font.dataUrl);
    if (!tag.isConnected) return;
    if (!url) throw new Error('La fuente no tiene un archivo asociado.');
    tag.textContent = `@font-face{font-family:${cssString(font.family)};src:url(${cssString(url)}) format(${cssString(font.format)});font-weight:100 900;font-style:normal;font-display:swap;}`;
    await document.fonts.load(`16px ${cssString(font.family)}`);
  })();
  fonts.set(font.id, { font, tag, ready });
  // Keep a handler attached; callers still receive the original rejected Promise.
  ready.catch(() => {});
  return ready;
}
async function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([promise, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(message)), 30000); })]);
  } finally { if (timer) clearTimeout(timer); }
}
export async function prepareAssetsForExport(root: HTMLElement): Promise<void> {
  // Explicitly resolve private image references before html-to-image clones the DOM.
  const images = Array.from(root.querySelectorAll('img'));
  await withTimeout(Promise.all(images.map(async image => {
    const reference = image.dataset.storageRef;
    if (reference) {
      const url = await storageAssets.displayUrl(reference);
      if (!url) throw new Error('No se pudo preparar una imagen privada.');
      if (image.getAttribute('src') !== url) image.src = url;
    }
    if (!image.getAttribute('src')) return;
    if (!image.complete || image.naturalWidth === 0) await image.decode();
    if (!image.naturalWidth) throw new Error('Una imagen no pudo cargarse. No se exporto un diploma incompleto.');
  })), 'La descarga de las imagenes tardo demasiado. Comprueba la conexion y reintenta.');
  const usedFamilies = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))]
    .map(element => getComputedStyle(element).fontFamily.toLowerCase());
  const usedFonts = [...fonts.values()].filter(item => usedFamilies.some(value => value.includes(item.font.family.toLowerCase())));
  await withTimeout(Promise.all(usedFonts.map(item => item.ready)), 'Una fuente no termino de cargar. Revisa el archivo antes de exportar.');
  await withTimeout(document.fonts.ready, 'Las fuentes del documento no terminaron de cargar.');
}
