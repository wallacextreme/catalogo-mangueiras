/**
 * asset-url.ts - Resolução universal de URLs de assets estáticos
 * Funciona transparentemente em:
 * 1. Dev local (localhost:5180)
 * 2. Produção PWA / GitHub Pages (/catalogo-mangueiras/)
 * 3. Desktop Windows Tauri v2
 */

export function resolveAssetUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (/^(data:|blob:|https?:|\.\/|\.\.\/)/i.test(url)) return url;
  if (url.startsWith('/catalog-images/')) return '.' + url;
  if (url.startsWith('catalog-images/')) return './' + url;
  if (url.startsWith('/data/')) return '.' + url;
  if (url.startsWith('data/')) return './' + url;
  if (url.startsWith('/')) return '.' + url;
  return './' + url;
}
