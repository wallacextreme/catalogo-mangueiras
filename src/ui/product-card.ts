/**
 * src/ui/product-card.ts
 * Renderização dos Cards de Produto no Daylight Counter Mode (Alto Contraste Industrial)
 * e no Modo Mural Visual de Identificação Rápida.
 */

import { CatalogItem } from '../types/catalog';
import { Icons } from './icons';

export interface CardActionCallbacks {
  onZoom: (item: CatalogItem, imageIndex: number) => void;
  onEdit: (item: CatalogItem) => void;
  onBoxClick?: (boxNumber: string) => void;
  onQuickBoxEdit?: (item: CatalogItem, newBox: string) => void;
}

export function renderProductCard(
  item: CatalogItem,
  viewMode: 'grid' | 'mural',
  hidePrices: boolean,
  callbacks: CardActionCallbacks
): HTMLElement {
  const card = document.createElement('article');
  card.className = 'group relative flex flex-col rounded-xl border transition-all duration-150 ';

  if (viewMode === 'mural') {
    // MODO MURAL VISUAL: foco total na foto ampliada para identificação por amostra
    card.className += 'bg-white dark:bg-counter-darkCard border-slate-200 dark:border-counter-darkBorder hover:border-counter-blue dark:hover:border-blue-500 hover:shadow-md overflow-hidden';

    const mainImage = item.primaryImage || (item.images && item.images.length > 0 ? item.images[0] : null);
    const boxDisplay = item.boxNumber ? item.boxNumber : 'S/ CAIXA';
    const codeDisplay = item.internalCode ? item.internalCode : '';

    card.innerHTML = `
      <!-- Imagem Ampliada do Mural -->
      <div class="relative w-full aspect-square bg-white flex items-center justify-center p-3 cursor-zoom-in overflow-hidden border-b border-slate-100 dark:border-slate-800">
        ${mainImage ? `
          <img src="${mainImage}" alt="${item.cleanDescription}" loading="lazy" class="w-full h-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-200" />
        ` : `
          <div class="flex flex-col items-center justify-center text-slate-400 text-xs">
            ${Icons.camera('w-10 h-10 mb-1 text-slate-300')}
            <span>Sem Foto</span>
          </div>
        `}

        ${item.images && item.images.length > 1 ? `
          <span class="absolute top-2 right-2 bg-slate-900/80 text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
            +${item.images.length - 1} fotos
          </span>
        ` : ''}

        ${item.needsDescriptionReview ? `
          <span class="absolute top-2 left-2 bg-amber-500 text-slate-950 font-bold text-[10px] px-1.5 py-0.5 rounded shadow flex items-center gap-1">
            ${Icons.alertTriangle('w-3 h-3')} Revisar
          </span>
        ` : ''}
      </div>

      <!-- Rodapé de Localização Imediata -->
      <div class="p-2.5 flex flex-col gap-1.5 bg-slate-50 dark:bg-slate-900/60 flex-1 justify-between">
        <div class="flex items-center justify-between gap-1">
          <div class="bg-blue-600 text-white font-mono font-black text-lg px-2 py-0.5 rounded shadow-sm flex items-center gap-1 cursor-pointer hover:bg-blue-700" title="Clique para filtrar esta caixa">
            ${Icons.box('w-4 h-4')}
            <span>${boxDisplay}</span>
          </div>
          ${codeDisplay ? `
            <span class="bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-mono font-bold text-xs px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-800">
              ${codeDisplay}
            </span>
          ` : ''}
        </div>

        <p class="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight">
          ${item.cleanDescription}
        </p>

        <div class="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
          <span class="truncate max-w-[120px] font-semibold text-slate-600 dark:text-slate-400">${item.section}</span>
          <button class="btn-edit text-slate-500 hover:text-blue-600 p-1 rounded" title="Editar / Adicionar fotos">
            ${Icons.edit('w-3.5 h-3.5')}
          </button>
        </div>
      </div>
    `;

    // Eventos do modo mural
    const imgContainer = card.querySelector('.cursor-zoom-in');
    imgContainer?.addEventListener('click', () => callbacks.onZoom(item, 0));

    const boxBadge = card.querySelector('.bg-blue-600');
    boxBadge?.addEventListener('click', () => {
      if (item.boxNumber && callbacks.onBoxClick) callbacks.onBoxClick(item.boxNumber);
    });

    const editBtn = card.querySelector('.btn-edit');
    editBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      callbacks.onEdit(item);
    });

    return card;
  }

  // MODO GRADE PADRÃO DE BALCÃO: Alto contraste industrial com Badge Gigante da Caixa
  card.className += 'bg-white dark:bg-counter-darkCard border-slate-200 dark:border-counter-darkBorder hover:border-counter-blue dark:hover:border-blue-500 hover:shadow-lg';

  const mainImage = item.primaryImage || (item.images && item.images.length > 0 ? item.images[0] : null);
  const boxDisplay = item.boxNumber ? item.boxNumber : 'NÃO DEFINIDA';

  card.innerHTML = `
    <!-- Topo: BADGE GIGANTE DA CAIXA (Quality Gate 1 - Alto Contraste Industrial) -->
    <div class="p-3 bg-slate-900 text-white rounded-t-xl flex items-center justify-between border-b-2 border-amber-500">
      <div class="flex items-center gap-2 cursor-pointer hover:opacity-90" title="Filtrar por esta caixa">
        ${Icons.box('w-6 h-6 text-amber-400')}
        <div>
          <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider block leading-none">LOCALIZAÇÃO BALCÃO</span>
          <span class="font-mono text-2xl font-black text-amber-400 tracking-tight leading-none">${boxDisplay}</span>
        </div>
      </div>

      ${item.internalCode ? `
        <div class="text-right">
          <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider block leading-none">CÓD. INTERNO</span>
          <span class="font-mono text-lg font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700 leading-none inline-block mt-0.5">
            ${item.internalCode}
          </span>
        </div>
      ` : ''}
    </div>

    <!-- Corpo: Foto e Informações Técnicas -->
    <div class="p-3.5 flex flex-col gap-3 flex-1">
      <!-- Imagem Central com Zoom -->
      <div class="relative w-full h-48 bg-white rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-center p-2 cursor-zoom-in group/img overflow-hidden">
        ${mainImage ? `
          <img src="${mainImage}" alt="${item.cleanDescription}" loading="lazy" class="w-full h-full object-contain filter drop-shadow-sm group-hover/img:scale-105 transition-transform duration-200" />
        ` : `
          <div class="flex flex-col items-center justify-center text-slate-400 text-xs">
            ${Icons.camera('w-12 h-12 mb-1.5 text-slate-300')}
            <span class="font-medium">Sem Foto Cadastrada</span>
          </div>
        `}

        ${item.images && item.images.length > 1 ? `
          <span class="absolute bottom-2 right-2 bg-slate-900/80 text-white font-mono text-xs font-bold px-2 py-0.5 rounded-md shadow flex items-center gap-1">
            ${Icons.camera('w-3.5 h-3.5')} ${item.images.length} fotos
          </span>
        ` : ''}

        ${item.needsDescriptionReview ? `
          <div class="absolute top-2 left-2 bg-amber-500 text-slate-950 font-bold text-xs px-2 py-0.5 rounded shadow flex items-center gap-1">
            ${Icons.alertTriangle('w-3.5 h-3.5')} Foto Sem Descrição
          </div>
        ` : ''}

        <button class="btn-zoom-overlay absolute top-2 right-2 p-1.5 rounded-md bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 opacity-0 group-hover/img:opacity-100 transition-opacity shadow" title="Ampliar Foto">
          ${Icons.zoomIn('w-4 h-4')}
        </button>
      </div>

      <!-- Descrição da Peça -->
      <div>
        <span class="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-0.5">
          ${item.section}
        </span>
        <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
          ${item.cleanDescription}
        </h3>
      </div>

      <!-- Códigos de Referência / Fabricante com Botão Copiar -->
      ${item.referenceCodes && item.referenceCodes.length > 0 ? `
        <div class="flex flex-wrap gap-1.5 items-center">
          <span class="text-[11px] font-bold text-slate-400">Refs:</span>
          ${item.referenceCodes.map(ref => `
            <button class="btn-copy-ref font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 flex items-center gap-1 transition-colors" data-ref="${ref}" title="Clique para copiar">
              <span>${ref}</span>
              ${Icons.copy('w-3 h-3 text-slate-400')}
            </button>
          `).join('')}
        </div>
      ` : ''}

      <!-- Montadoras e Especificações -->
      <div class="flex flex-wrap gap-1 items-center mt-auto">
        ${(item.manufacturers || []).map(mfr => `
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            ${mfr}
          </span>
        `).join('')}

        ${(item.technicalSpecs || []).map(spec => `
          <span class="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            ${spec}
          </span>
        `).join('')}
      </div>
    </div>

    <!-- Barra de Rodapé do Card -->
    <div class="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between rounded-b-xl">
      <!-- Preço se disponível e não oculto -->
      <div>
        ${!hidePrices && item.price !== null ? `
          <span class="text-[10px] uppercase font-bold text-slate-400 block leading-none">PREÇO BALCÃO</span>
          <span class="font-mono text-base font-black text-emerald-600 dark:text-emerald-400 leading-none">
            R$ ${item.price.toFixed(2)}
          </span>
        ` : `
          <span class="text-xs text-slate-400 font-mono">
            ${item.stockQty !== null ? `Estoque: ${item.stockQty}` : 'Uso Interno'}
          </span>
        `}
      </div>

      <div class="flex items-center gap-1">
        <button class="btn-card-edit px-2.5 py-1 text-xs font-bold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-blue-600 transition-colors flex items-center gap-1 shadow-sm">
          ${Icons.edit('w-3.5 h-3.5')}
          <span>Editar</span>
        </button>
      </div>
    </div>
  `;

  // Eventos de clique do Card
  const imgBox = card.querySelector('.cursor-zoom-in');
  imgBox?.addEventListener('click', () => callbacks.onZoom(item, 0));

  const boxBadge = card.querySelector('.text-amber-400');
  boxBadge?.parentElement?.addEventListener('click', () => {
    if (item.boxNumber && callbacks.onBoxClick) callbacks.onBoxClick(item.boxNumber);
  });

  const editBtn = card.querySelector('.btn-card-edit');
  editBtn?.addEventListener('click', () => callbacks.onEdit(item));

  // Botões de copiar códigos de referência
  const copyButtons = card.querySelectorAll<HTMLButtonElement>('.btn-copy-ref');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const ref = btn.getAttribute('data-ref');
      if (ref) {
        await navigator.clipboard.writeText(ref);
        const originalHtml = btn.innerHTML;
        btn.innerHTML = `<span>${ref}</span> ${Icons.copySuccess('w-3 h-3')}`;
        setTimeout(() => {
          btn.innerHTML = originalHtml;
        }, 1500);
      }
    });
  });

  return card;
}
