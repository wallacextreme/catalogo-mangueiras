/**
 * src/ui/app-header.ts
 * Barra Superior do Balcão com Omnibox de Alta Velocidade (< 50ms),
 * Alternadores de Visualização e Modos de Operação.
 */

import { FilterState } from '../types/catalog';
import { Icons } from './icons';

export interface HeaderCallbacks {
  onSearch: (query: string) => void;
  onToggleViewMode: () => void;
  onToggleHidePrices: () => void;
  onToggleDarkMode: () => void;
  onNewProduct: () => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onPrintBoxMap: () => void;
}

export function renderHeader(
  state: FilterState,
  totalCount: number,
  filteredCount: number,
  callbacks: HeaderCallbacks
): HTMLElement {
  const header = document.createElement('header');
  header.className = 'sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm px-4 py-3 select-none';

  header.innerHTML = `
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
      <!-- Identificação do Balcão e Contador -->
      <div class="flex items-center justify-between w-full md:w-auto gap-3">
        <div class="flex items-center gap-2.5">
          <div class="p-2 bg-blue-600 text-white rounded-xl shadow-md">
            ${Icons.box('w-6 h-6')}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-base font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">
                CATÁLOGO DE MANGUEIRAS
              </h1>
              <span class="bg-amber-500 text-slate-950 font-mono text-[10px] font-black px-1.5 py-0.5 rounded uppercase">
                Offline-First
              </span>
            </div>
            <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Localizador Visual de Caixas & Mangueiras de Balcão
            </span>
          </div>
        </div>

        <div class="md:hidden flex items-center gap-1 font-mono text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
          <span class="text-blue-600 dark:text-blue-400">${filteredCount}</span>/${totalCount}
        </div>
      </div>

      <!-- Barra de Busca Omnibox (< 50ms) -->
      <div class="relative flex-1 w-full max-w-2xl">
        <div class="relative flex items-center">
          <span class="absolute left-3.5 text-slate-400">
            ${Icons.search('w-5 h-5')}
          </span>
          <input
            type="text"
            id="omnibox-search"
            value="${state.searchQuery}"
            placeholder="Digite Caixa (ex: 384, 412, 16), Código (21926-9, 15050-0), Veículo (Palio, Gol, Opala)... (Pressione /)"
            class="w-full pl-11 pr-20 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 font-semibold text-sm placeholder:text-slate-400 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none shadow-inner transition-all"
            autocomplete="off"
            spellcheck="false"
          />
          <div class="absolute right-2.5 flex items-center gap-1">
            ${state.searchQuery ? `
              <button id="btn-clear-search" class="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" title="Limpar busca">
                ${Icons.close('w-4 h-4')}
              </button>
            ` : `
              <kbd class="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-200 dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 shadow-xs">
                /
              </kbd>
            `}
          </div>
        </div>
      </div>

      <!-- Ações da Barra Superior -->
      <div class="flex items-center justify-between w-full md:w-auto gap-2">
        <div class="hidden md:flex items-center gap-1 font-mono text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <span class="text-blue-600 dark:text-blue-400 font-black">${filteredCount}</span>
          <span class="text-slate-400">/</span>
          <span>${totalCount} peças</span>
        </div>

        <div class="flex items-center gap-1.5">
          <!-- Toggle Modo Visual Mural vs Grade -->
          <button id="btn-toggle-view" class="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 text-xs font-bold shadow-xs" title="${state.viewMode === 'grid' ? 'Mudar para Mural Visual (Fotos Grandes para Comparar Amostra)' : 'Mudar para Grade Detalhada de Balcão'}">
            ${state.viewMode === 'grid' ? Icons.layoutGrid('w-4 h-4 text-blue-600 dark:text-blue-400') : Icons.grid('w-4 h-4 text-emerald-600 dark:text-emerald-400')}
            <span class="hidden sm:inline">${state.viewMode === 'grid' ? 'Grade' : 'Mural Visual'}</span>
          </button>

          <!-- Toggle Ocultar/Mostrar Preços -->
          <button id="btn-toggle-prices" class="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs" title="${state.hidePrices ? 'Mostrar Preços' : 'Ocultar Preços (Modo Cliente na Frente)'}">
            ${state.hidePrices ? Icons.eyeOff('w-4 h-4 text-amber-500') : Icons.eye('w-4 h-4 text-slate-600 dark:text-slate-300')}
          </button>

          <!-- Toggle Dark / Daylight Mode -->
          <button id="btn-toggle-theme" class="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs" title="Alternar Modo Claro (Daylight Counter) / Escuro">
            <span class="dark:hidden">${Icons.moon('w-4 h-4')}</span>
            <span class="hidden dark:inline">${Icons.sun('w-4 h-4')}</span>
          </button>

          <!-- Cadastrar Novo Produto -->
          <button id="btn-new-product" class="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors">
            ${Icons.plus('w-4 h-4')}
            <span class="hidden sm:inline">Nova Peça</span>
          </button>

          <!-- Menu de Opções / Backup -->
          <div class="relative group">
            <button id="btn-more-options" class="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs" title="Opções, Backup e Relatórios">
              ${Icons.chevronDown('w-4 h-4')}
            </button>
            <div class="absolute right-0 top-full mt-1.5 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 hidden group-hover:block hover:block z-40">
              <button id="opt-export-backup" class="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                ${Icons.download('w-4 h-4 text-blue-500')}
                <span>Exportar Backup (SHA-256)</span>
              </button>
              <label class="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer">
                ${Icons.upload('w-4 h-4 text-emerald-500')}
                <span>Restaurar Backup</span>
                <input type="file" id="inp-import-file" accept=".json" class="hidden" />
              </label>
              <div class="border-t border-slate-100 dark:border-slate-700 my-1"></div>
              <button id="opt-print-map" class="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                ${Icons.printer('w-4 h-4 text-amber-500')}
                <span>Imprimir Mapa de Caixas</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Eventos
  const searchInput = header.querySelector<HTMLInputElement>('#omnibox-search');
  searchInput?.addEventListener('input', () => {
    callbacks.onSearch(searchInput.value);
  });

  header.querySelector('#btn-clear-search')?.addEventListener('click', () => {
    if (searchInput) {
      searchInput.value = '';
      callbacks.onSearch('');
      searchInput.focus();
    }
  });

  header.querySelector('#btn-toggle-view')?.addEventListener('click', () => callbacks.onToggleViewMode());
  header.querySelector('#btn-toggle-prices')?.addEventListener('click', () => callbacks.onToggleHidePrices());
  header.querySelector('#btn-toggle-theme')?.addEventListener('click', () => callbacks.onToggleDarkMode());
  header.querySelector('#btn-new-product')?.addEventListener('click', () => callbacks.onNewProduct());
  header.querySelector('#opt-export-backup')?.addEventListener('click', () => callbacks.onExportBackup());
  header.querySelector('#opt-print-map')?.addEventListener('click', () => callbacks.onPrintBoxMap());

  const fileInput = header.querySelector<HTMLInputElement>('#inp-import-file');
  fileInput?.addEventListener('change', () => {
    if (fileInput.files && fileInput.files[0]) {
      callbacks.onImportBackup(fileInput.files[0]);
      fileInput.value = '';
    }
  });

  return header;
}
