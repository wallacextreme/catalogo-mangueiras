/**
 * src/main.ts
 * Ponto de entrada principal da aplicação Catálogo Interno de Balcão.
 * Integração 100% funcional entre IndexedDB, SearchEngine, UI e Modais.
 */

import './style.css';
import { CatalogItem, FilterState, VisualStatus, SortOption } from './types/catalog';
import { dbService } from './storage/indexeddb-service';
import { SearchEngine } from './search/search-engine';
import { renderHeader } from './ui/app-header';
import { renderFilterBar } from './ui/filter-bar';
import { renderProductCard } from './ui/product-card';
import { LightboxModal } from './ui/lightbox';
import { ProductFormModal } from './ui/product-form-modal';
import { Icons } from './ui/icons';

class CatalogApp {
  private allProducts: CatalogItem[] = [];
  private searchEngine: SearchEngine = new SearchEngine();
  private lightbox: LightboxModal;
  private productModal: ProductFormModal;

  private state: FilterState = {
    searchQuery: '',
    selectedSection: '',
    selectedManufacturer: '',
    visualStatus: 'all',
    viewMode: (localStorage.getItem('viewMode') as 'grid' | 'mural') || 'grid',
    hidePrices: localStorage.getItem('hidePrices') === 'true',
    sortBy: 'box'
  };

  private appContainer: HTMLElement;
  private headerMount: HTMLElement | null = null;
  private filterMount: HTMLElement | null = null;
  private contentMount: HTMLElement | null = null;

  constructor() {
    this.appContainer = document.getElementById('app')!;
    this.initTheme();
    this.lightbox = new LightboxModal();
    this.productModal = new ProductFormModal();
    this.setupGlobalShortcuts();
  }

  public async start(): Promise<void> {
    this.renderLoading();

    try {
      // Limpeza preventiva de caches legados no navegador
      if (typeof window !== 'undefined' && 'caches' in window) {
        try {
          const keys = await caches.keys();
          for (const key of keys) {
            if (key !== 'balcao-mangueiras-v1') {
              await caches.delete(key);
            }
          }
        } catch {
          // ignora
        }
      }

      // 1. Carrega o seed estático gerado da extração dos arquivos Word de Mangueiras (com cache-buster)
      const response = await fetch(`./data/catalog-master-seed.json?t=${Date.now()}`);
      if (!response.ok) {
        throw new Error(`Falha ao carregar seed de catálogo: status ${response.status}`);
      }
      const seedData: CatalogItem[] = await response.json();

      // 2. Sincroniza com o IndexedDB mantendo isolamento inviolável de dados da loja (Gate 8)
      this.allProducts = await dbService.syncStaticCatalogUpdates(seedData);

      // 3. Constrói o índice de busca em memória
      this.searchEngine.buildIndex(this.allProducts);

      // 4. Monta a interface do usuário
      this.mountApp();
      this.render();
    } catch (err) {
      this.renderError((err as Error).message);
    }
  }

  private initTheme(): void {
    const isDark = localStorage.getItem('theme') === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  private toggleTheme(): void {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    this.renderHeader();
  }

  private setupGlobalShortcuts(): void {
    window.addEventListener('keydown', (e) => {
      // Focar na busca ao pressionar "/" se não estiver digitando em um input
      if (e.key === '/' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        const searchInput = document.getElementById('omnibox-search') as HTMLInputElement | null;
        searchInput?.focus();
        searchInput?.select();
      }
      // Rolagem de página preservada com teclas de direção totalmente livres
    });
  }

  private mountApp(): void {
    this.appContainer.innerHTML = `
      <div id="header-container"></div>
      <div id="filter-container"></div>
      <main class="flex-1 max-w-7xl mx-auto w-full p-4">
        <div id="content-container"></div>
      </main>
    `;

    this.headerMount = document.getElementById('header-container');
    this.filterMount = document.getElementById('filter-container');
    this.contentMount = document.getElementById('content-container');
  }

  private render(): void {
    this.renderHeader();
    this.renderFilters();
    this.renderProducts();
  }

  private renderHeader(): void {
    if (!this.headerMount) return;

    const filtered = this.searchEngine.search(this.state);
    const headerEl = renderHeader(
      this.state,
      this.allProducts.length,
      filtered.length,
      {
        onSearch: (q) => {
          this.state.searchQuery = q;
          this.renderProducts();
        },
        onToggleViewMode: () => {
          this.state.viewMode = this.state.viewMode === 'grid' ? 'mural' : 'grid';
          localStorage.setItem('viewMode', this.state.viewMode);
          this.render();
        },
        onToggleHidePrices: () => {
          this.state.hidePrices = !this.state.hidePrices;
          localStorage.setItem('hidePrices', String(this.state.hidePrices));
          this.renderHeader();
          this.renderProducts();
        },
        onToggleDarkMode: () => this.toggleTheme(),
        onNewProduct: () => {
          this.productModal.open(null, (saved) => this.handleProductSaved(saved));
        },
        onExportBackup: () => this.handleExportBackup(),
        onImportBackup: (f) => this.handleImportBackup(f),
        onPrintBoxMap: () => window.print()
      }
    );

    this.headerMount.innerHTML = '';
    this.headerMount.appendChild(headerEl);
  }

  private renderFilters(): void {
    if (!this.filterMount) return;

    // Calcula contagem por seção
    const counts: Record<string, number> = {};
    for (const p of this.allProducts) {
      counts[p.section] = (counts[p.section] || 0) + 1;
    }

    const filterEl = renderFilterBar(
      this.state,
      counts,
      {
        onSelectSection: (sec) => {
          this.state.selectedSection = sec;
          this.render();
        },
        onSelectManufacturer: (mfr) => {
          this.state.selectedManufacturer = mfr;
          this.render();
        },
        onSelectVisualStatus: (st: VisualStatus) => {
          this.state.visualStatus = st;
          this.render();
        },
        onSelectSortBy: (sort: SortOption) => {
          this.state.sortBy = sort;
          this.renderProducts();
        },
        onClearAllFilters: () => {
          this.state.selectedSection = '';
          this.state.selectedManufacturer = '';
          this.state.visualStatus = 'all';
          this.state.searchQuery = '';
          this.render();
        }
      }
    );

    this.filterMount.innerHTML = '';
    this.filterMount.appendChild(filterEl);
  }

  private renderProducts(): void {
    if (!this.contentMount) return;

    const filtered = this.searchEngine.search(this.state);

    if (filtered.length === 0) {
      this.contentMount.innerHTML = `
        <div class="flex flex-col items-center justify-center p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm my-6">
          <div class="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-3 text-slate-400">
            ${Icons.search('w-10 h-10')}
          </div>
          <h3 class="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">Nenhuma peça encontrada</h3>
          <p class="text-xs max-w-sm text-slate-500 mb-4">Verifique o número da caixa ou o código digitado, ou limpe os filtros aplicados.</p>
          <button id="btn-empty-clear" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors">
            Limpar Busca e Filtros
          </button>
        </div>
      `;

      this.contentMount.querySelector('#btn-empty-clear')?.addEventListener('click', () => {
        this.state.searchQuery = '';
        this.state.selectedSection = '';
        this.state.selectedManufacturer = '';
        this.state.visualStatus = 'all';
        this.render();
      });

      return;
    }

    // Grid container
    const grid = document.createElement('div');
    grid.id = 'products-grid';

    if (this.state.viewMode === 'mural') {
      grid.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3';
    } else {
      grid.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4';
    }

    for (const item of filtered) {
      const card = renderProductCard(
        item,
        this.state.viewMode,
        this.state.hidePrices,
        {
          onZoom: (itm, idx) => this.lightbox.open(itm, idx),
          onEdit: (itm) => this.productModal.open(itm, (saved) => this.handleProductSaved(saved)),
          onBoxClick: (box) => {
            this.state.searchQuery = box;
            const searchInput = document.getElementById('omnibox-search') as HTMLInputElement | null;
            if (searchInput) searchInput.value = box;
            this.renderProducts();
          }
        }
      );
      grid.appendChild(card);
    }

    this.contentMount.innerHTML = '';
    this.contentMount.appendChild(grid);
  }

  private handleProductSaved(saved: CatalogItem): void {
    const idx = this.allProducts.findIndex(p => p.id === saved.id);
    if (idx >= 0) {
      this.allProducts[idx] = saved;
    } else {
      this.allProducts.unshift(saved);
    }

    this.searchEngine.buildIndex(this.allProducts);
    this.render();
  }

  private async handleExportBackup(): Promise<void> {
    try {
      const backupJson = await dbService.exportStoreBackup();
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-balcao-miudezas-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Erro ao exportar backup: ${(err as Error).message}`);
    }
  }

  private async handleImportBackup(file: File): Promise<void> {
    try {
      const text = await file.text();
      const res = await dbService.importStoreBackup(text);
      if (res.success) {
        alert(`Backup restaurado com sucesso! ${res.count} itens atualizados.`);
        this.allProducts = await dbService.getAllProducts();
        this.searchEngine.buildIndex(this.allProducts);
        this.render();
      } else {
        alert(`Erro na restauração: ${res.error}`);
      }
    } catch (err) {
      alert(`Falha ao ler arquivo de backup: ${(err as Error).message}`);
    }
  }

  private renderLoading(): void {
    this.appContainer.innerHTML = `
      <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900 text-white">
        <div class="p-4 bg-blue-600 rounded-2xl shadow-xl mb-4 animate-pulse">
          ${Icons.box('w-12 h-12')}
        </div>
        <h2 class="text-xl font-black uppercase tracking-tight mb-2">Carregando Catálogo de Balcão...</h2>
        <p class="text-xs text-slate-400 font-mono">Indexando caixas, fotos e códigos internos</p>
      </div>
    `;
  }

  private renderError(msg: string): void {
    this.appContainer.innerHTML = `
      <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900 text-white text-center">
        <div class="p-4 bg-red-600/30 text-red-400 rounded-2xl mb-4">
          ${Icons.alertTriangle('w-12 h-12')}
        </div>
        <h2 class="text-xl font-bold mb-2">Erro ao Iniciar Catálogo</h2>
        <p class="text-sm text-slate-400 max-w-md mb-6">${msg}</p>
        <button onclick="window.location.reload()" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors">
          Tentar Novamente
        </button>
      </div>
    `;
  }
}

// Inicializa no carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
  const app = new CatalogApp();
  app.start();
});
