/**
 * src/ui/filter-bar.ts
 * Barra de Filtros Rápidos de 1 Clique (Seções, Montadoras, Status Visual e Ordenação).
 */

import { FilterState, VisualStatus, SortOption } from '../types/catalog';
import { CATALOG_SECTIONS, ALL_MANUFACTURERS } from './product-form-modal';
import { Icons } from './icons';

export interface FilterBarCallbacks {
  onSelectSection: (section: string) => void;
  onSelectManufacturer: (mfr: string) => void;
  onSelectVisualStatus: (status: VisualStatus) => void;
  onSelectSortBy: (sort: SortOption) => void;
  onClearAllFilters: () => void;
}

export function renderFilterBar(
  state: FilterState,
  sectionCounts: Record<string, number>,
  callbacks: FilterBarCallbacks
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 text-xs select-none backdrop-blur-sm';

  const hasActiveFilters = state.selectedSection || state.selectedManufacturer || state.visualStatus !== 'all';

  container.innerHTML = `
    <div class="max-w-7xl mx-auto flex flex-col gap-2.5">
      <!-- Linha 1: Filtro de Seções (Carrossel Horizontal de Pills com contagem) -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
        <span class="font-bold text-slate-400 uppercase tracking-wider text-[10px] shrink-0">Seções:</span>
        <button class="btn-filter-section shrink-0 px-3 py-1 rounded-full font-bold transition-colors ${!state.selectedSection ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}" data-section="">
          Todas
        </button>
        ${CATALOG_SECTIONS.map(sec => {
          const count = sectionCounts[sec] || 0;
          const isSelected = state.selectedSection === sec;
          return `
            <button class="btn-filter-section shrink-0 px-3 py-1 rounded-full font-bold transition-colors flex items-center gap-1.5 ${isSelected ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}" data-section="${sec}">
              <span>${sec}</span>
              <span class="font-mono text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-blue-800 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}">
                ${count}
              </span>
            </button>
          `;
        }).join('')}
      </div>

      <!-- Linha 2: Montadoras, Status Visual e Ordenação -->
      <div class="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
        <!-- Montadoras -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <span class="font-bold text-slate-400 uppercase tracking-wider text-[10px] shrink-0">Montadora:</span>
          <button class="btn-filter-mfr px-2.5 py-0.5 rounded-lg font-semibold transition-colors ${!state.selectedManufacturer ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}" data-mfr="">
            Todas
          </button>
          ${ALL_MANUFACTURERS.map(mfr => `
            <button class="btn-filter-mfr px-2.5 py-0.5 rounded-lg font-semibold transition-colors shrink-0 ${state.selectedManufacturer === mfr ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}" data-mfr="${mfr}">
              ${mfr}
            </button>
          `).join('')}
        </div>

        <!-- Status Visual e Ordenação -->
        <div class="flex items-center gap-2 ml-auto">
          <!-- Filtro de Status Visual -->
          <div class="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
            <button class="btn-visual-status px-2 py-0.5 rounded-md font-semibold transition-colors ${state.visualStatus === 'all' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'}" data-status="all">
              Todos
            </button>
            <button class="btn-visual-status px-2 py-0.5 rounded-md font-semibold transition-colors ${state.visualStatus === 'with-photo' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'}" data-status="with-photo">
              Com Foto
            </button>
            <button class="btn-visual-status px-2 py-0.5 rounded-md font-semibold transition-colors ${state.visualStatus === 'without-photo' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'}" data-status="without-photo">
              Sem Foto
            </button>
            <button class="btn-visual-status px-2 py-0.5 rounded-md font-semibold transition-colors ${state.visualStatus === 'visual-only' ? 'bg-amber-500 text-slate-950 font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400'}" data-status="visual-only" title="Itens que possuem apenas Foto e Caixa para revisar">
              Foto+Caixa (Revisar)
            </button>
          </div>

          <!-- Ordenação -->
          <div class="flex items-center gap-1">
            <select id="sel-sort-by" class="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold outline-none text-xs">
              <option value="box" ${state.sortBy === 'box' ? 'selected' : ''}>Ordenar: Caixa</option>
              <option value="code" ${state.sortBy === 'code' ? 'selected' : ''}>Ordenar: Cód. Interno</option>
              <option value="description" ${state.sortBy === 'description' ? 'selected' : ''}>Ordenar: Descrição</option>
              <option value="section" ${state.sortBy === 'section' ? 'selected' : ''}>Ordenar: Seção</option>
            </select>
          </div>

          ${hasActiveFilters ? `
            <button id="btn-clear-filters" class="px-2 py-1 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 transition-colors flex items-center gap-1" title="Limpar todos os filtros">
              ${Icons.close('w-3.5 h-3.5')}
              <span>Limpar</span>
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  // Eventos de Seções
  container.querySelectorAll('.btn-filter-section').forEach(btn => {
    btn.addEventListener('click', () => {
      const sec = btn.getAttribute('data-section') || '';
      callbacks.onSelectSection(sec);
    });
  });

  // Eventos de Montadoras
  container.querySelectorAll('.btn-filter-mfr').forEach(btn => {
    btn.addEventListener('click', () => {
      const mfr = btn.getAttribute('data-mfr') || '';
      callbacks.onSelectManufacturer(mfr);
    });
  });

  // Eventos de Status Visual
  container.querySelectorAll('.btn-visual-status').forEach(btn => {
    btn.addEventListener('click', () => {
      const status = (btn.getAttribute('data-status') || 'all') as VisualStatus;
      callbacks.onSelectVisualStatus(status);
    });
  });

  // Evento de Ordenação
  const sortSelect = container.querySelector<HTMLSelectElement>('#sel-sort-by');
  sortSelect?.addEventListener('change', () => {
    callbacks.onSelectSortBy(sortSelect.value as SortOption);
  });

  // Limpar Filtros
  container.querySelector('#btn-clear-filters')?.addEventListener('click', () => {
    callbacks.onClearAllFilters();
  });

  return container;
}
