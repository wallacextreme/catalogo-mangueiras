/**
 * src/ui/product-form-modal.ts
 * Modal Completo de Cadastro, Edição, Duplicação e Inclusão de Fotos via Ctrl+V e Drag & Drop.
 */

import { CatalogItem } from '../types/catalog';
import { Icons } from './icons';
import { convertBlobToStudioWebP } from '../media/webp-converter';
import { resolveAssetUrl } from '../media/asset-url';
import { dbService } from '../storage/indexeddb-service';

export const CATALOG_SECTIONS = [
  'Radiador Superior',
  'Radiador Inferior',
  'Radiador (Geral)',
  "Bomba D'Água",
  'Filtro de Ar',
  'Respiro de Óleo / Antichama',
  'Aquecedor (Ar Quente)',
  'Reservatório de Expansão',
  'Bocal do Tanque / Combustível',
  'Coletor de Admissão',
  'Cavalete / Termostato',
  'Direção Hidráulica',
  'Outras Mangueiras'
];

export const ALL_MANUFACTURERS = [
  'Fiat', 'Ford', 'GM', 'VW', 'Hyundai', 'Toyota', 'Renault', 'Peugeot/Citroën', 'Universal'
];

export class ProductFormModal {
  private container: HTMLDivElement | null = null;
  private currentItem: CatalogItem | null = null;
  private currentImages: string[] = [];
  private onSaveCallback: ((item: CatalogItem) => void) | null = null;

  constructor() {
    this.createDom();
  }

  private createDom(): void {
    this.container = document.createElement('div');
    this.container.id = 'product-form-modal';
    this.container.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm hidden p-4 overflow-y-auto';

    this.container.innerHTML = `
      <div class="relative w-full max-w-3xl bg-white dark:bg-counter-darkCard rounded-2xl shadow-2xl border border-slate-200 dark:border-counter-darkBorder overflow-hidden my-8">
        <!-- Cabeçalho do Modal -->
        <div class="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b-2 border-amber-500">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-amber-500 text-slate-950 rounded-lg">
              ${Icons.box('w-6 h-6')}
            </div>
            <div>
              <h2 id="modal-title" class="text-lg font-black tracking-tight leading-none text-white">Editar Peça</h2>
              <span class="text-xs text-slate-400 font-mono mt-0.5 block" id="modal-subtitle">Atualize localização, códigos e fotos</span>
            </div>
          </div>
          <button id="modal-close" class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <!-- Formulário -->
        <form id="product-form" class="p-6 flex flex-col gap-5 max-h-[75vh] overflow-y-auto">
          <!-- Linha 1: Localização de Balcão e Códigos -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Caixa -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                ${Icons.box('w-4 h-4')} Número da Caixa *
              </label>
              <input type="text" id="inp-box" required placeholder="Ex: 940, 10309, 1048B" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-amber-50/50 dark:bg-amber-950/20 text-slate-900 dark:text-slate-100 font-mono font-black text-xl focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>

            <!-- Código Interno -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                ${Icons.tag('w-4 h-4')} Código Interno
              </label>
              <input type="text" id="inp-code" placeholder="Ex: MU392, LT-2340, 526GR" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono font-bold text-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <!-- Categoria / Seção -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Categoria / Seção *
              </label>
              <select id="sel-section" required class="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                ${CATALOG_SECTIONS.map(s => `<option value="${s}">${s}</option>`).join('')}
              </select>
            </div>
          </div>

          <!-- Linha 2: Descrição da Peça -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Descrição e Aplicação da Peça *
            </label>
            <textarea id="inp-desc" rows="2" required placeholder="Ex: GRAMPO SUPERIOR BAGAGITO C3/C4" class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
          </div>

          <!-- Linha 3: Códigos de Referência e Montadoras -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Códigos de Referência -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Códigos de Referência (separados por vírgula)
              </label>
              <input type="text" id="inp-refs" placeholder="Ex: P-185, LF0437, JAHU 08271-9" class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <!-- Preço e Estoque Opcionais -->
            <div class="grid grid-cols-2 gap-2">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Preço Balcão (R$)
                </label>
                <input type="number" step="0.01" min="0" id="inp-price" placeholder="0.00" class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Qtd. Estoque
                </label>
                <input type="number" min="0" id="inp-stock" placeholder="0" class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
          </div>

          <!-- Montadoras Selecionadas -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Montadoras Relacionadas
            </label>
            <div class="flex flex-wrap gap-1.5" id="mfr-checkboxes">
              ${ALL_MANUFACTURERS.map(mfr => `
                <label class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold cursor-pointer select-none hover:bg-slate-100">
                  <input type="checkbox" name="mfr" value="${mfr}" class="rounded text-blue-600 focus:ring-0" />
                  <span>${mfr}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- Galeria de Fotos Multi-Ângulo + Ctrl+V -->
          <div class="flex flex-col gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                ${Icons.camera('w-4 h-4 text-blue-600')} Fotos da Peça (Multi-Ângulos & Ctrl+V)
              </label>
              <span class="text-[11px] text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                Dica: Tire print e aperte Ctrl+V para colar aqui!
              </span>
            </div>

            <!-- Área de Upload / Colar com Ctrl+V -->
            <div id="drop-zone" class="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-xl p-4 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-900/30 transition-colors">
              <div class="flex flex-col items-center gap-1 text-slate-500">
                ${Icons.upload('w-8 h-8 text-slate-400')}
                <p class="text-xs font-medium">
                  <span class="text-blue-600 dark:text-blue-400 font-bold">Clique para enviar</span>, arraste uma foto ou pressione <kbd class="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 font-mono text-[11px] rounded font-bold">Ctrl+V</kbd>
                </p>
                <span class="text-[10px] text-slate-400">Conversão automática para WebP Ultra Nitidez (Quality 0.96)</span>
              </div>
              <input type="file" id="file-input" accept="image/*" class="hidden" multiple />
            </div>

            <!-- Grade de Imagens Cadastradas -->
            <div id="image-gallery-preview" class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-2"></div>
          </div>
        </form>

        <!-- Barra Inferior de Ações -->
        <div class="px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <button type="button" id="btn-duplicate" class="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors">
              ${Icons.copy('w-4 h-4')} Duplicar Peça
            </button>
            <button type="button" id="btn-delete" class="px-3 py-2 text-xs font-bold rounded-xl border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950 text-red-600 dark:text-red-400 flex items-center gap-1.5 transition-colors hidden">
              ${Icons.trash('w-4 h-4')} Excluir
            </button>
          </div>

          <div class="flex items-center gap-2">
            <button type="button" id="btn-cancel" class="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
              Cancelar
            </button>
            <button type="button" id="btn-save" class="px-5 py-2 text-xs font-black rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-md transition-colors">
              ${Icons.check('w-4 h-4')} Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);
    this.bindEvents();
  }

  private bindEvents(): void {
    if (!this.container) return;

    this.container.querySelector('#modal-close')?.addEventListener('click', () => this.close());
    this.container.querySelector('#btn-cancel')?.addEventListener('click', () => this.close());

    // Salvar
    this.container.querySelector('#btn-save')?.addEventListener('click', () => this.handleSave());

    // Duplicar
    this.container.querySelector('#btn-duplicate')?.addEventListener('click', () => this.handleDuplicate());

    // Excluir
    this.container.querySelector('#btn-delete')?.addEventListener('click', () => this.handleDelete());

    // Upload via Input
    const dropZone = this.container.querySelector('#drop-zone');
    const fileInput = this.container.querySelector<HTMLInputElement>('#file-input');

    dropZone?.addEventListener('click', () => fileInput?.click());

    fileInput?.addEventListener('change', async () => {
      if (fileInput.files) {
        for (let i = 0; i < fileInput.files.length; i++) {
          await this.processAndAddImage(fileInput.files[i]);
        }
        fileInput.value = '';
      }
    });

    // Drag & Drop
    dropZone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-blue-500', 'bg-blue-50/20');
    });

    dropZone?.addEventListener('dragleave', () => {
      dropZone.classList.remove('border-blue-500', 'bg-blue-50/20');
    });

    dropZone?.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-blue-500', 'bg-blue-50/20');
      const files = (e as DragEvent).dataTransfer?.files;
      if (files) {
        for (let i = 0; i < files.length; i++) {
          await this.processAndAddImage(files[i]);
        }
      }
    });

    // Colar com Ctrl+V diretamente na janela quando o modal estiver aberto (Gate 4)
    window.addEventListener('paste', async (e: ClipboardEvent) => {
      if (!this.container || this.container.classList.contains('hidden')) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            await this.processAndAddImage(file);
          }
        }
      }
    });
  }

  private async processAndAddImage(blob: Blob): Promise<void> {
    try {
      const converted = await convertBlobToStudioWebP(blob, 0.96);
      // Salva no IndexedDB
      await dbService.saveLocalImage(converted.sha256, converted.dataUrl);

      // Adiciona na lista de imagens do item atual
      this.currentImages.push(converted.dataUrl);
      this.renderGalleryPreview();
    } catch (err) {
      alert(`Erro ao processar imagem: ${(err as Error).message}`);
    }
  }

  private renderGalleryPreview(): void {
    const gallery = this.container?.querySelector('#image-gallery-preview');
    if (!gallery) return;

    if (this.currentImages.length === 0) {
      gallery.innerHTML = '<span class="text-xs text-slate-400 col-span-full">Nenhuma foto adicionada.</span>';
      return;
    }

    gallery.innerHTML = this.currentImages.map((imgSrc, idx) => `
      <div class="relative group aspect-square rounded-lg border border-slate-200 dark:border-slate-700 bg-white p-1 overflow-hidden">
        <img src="${resolveAssetUrl(imgSrc)}" class="w-full h-full object-contain" alt="Foto ${idx + 1}" />
        <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
          <button type="button" class="btn-del-img p-1 rounded bg-red-600 text-white" data-index="${idx}" title="Remover Foto">
            ${Icons.trash('w-3.5 h-3.5')}
          </button>
        </div>
        ${idx === 0 ? `
          <span class="absolute bottom-1 left-1 bg-blue-600 text-white text-[9px] font-bold px-1 rounded">Principal</span>
        ` : ''}
      </div>
    `).join('');

    // Eventos de remoção de imagem
    gallery.querySelectorAll('.btn-del-img').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.getAttribute('data-index') || '0', 10);
        this.currentImages.splice(index, 1);
        this.renderGalleryPreview();
      });
    });
  }

  public open(item: CatalogItem | null, onSave: (saved: CatalogItem) => void): void {
    if (!this.container) return;
    this.currentItem = item;
    this.onSaveCallback = onSave;
    this.currentImages = item?.images ? [...item.images] : [];

    const titleEl = this.container.querySelector('#modal-title');
    const deleteBtn = this.container.querySelector('#btn-delete');

    if (item) {
      if (titleEl) titleEl.textContent = 'Editar Peça de Balcão';
      deleteBtn?.classList.toggle('hidden', !item.isCustom);
      this.populateFields(item);
    } else {
      if (titleEl) titleEl.textContent = 'Nova Peça de Balcão';
      deleteBtn?.classList.add('hidden');
      this.resetFields();
    }

    this.renderGalleryPreview();
    this.container.classList.remove('hidden');
  }

  public close(): void {
    if (!this.container) return;
    this.container.classList.add('hidden');
    this.currentItem = null;
    this.currentImages = [];
  }

  private populateFields(item: CatalogItem): void {
    if (!this.container) return;

    (this.container.querySelector('#inp-box') as HTMLInputElement).value = item.boxNumber || '';
    (this.container.querySelector('#inp-code') as HTMLInputElement).value = item.internalCode || '';
    (this.container.querySelector('#sel-section') as HTMLSelectElement).value = item.section || CATALOG_SECTIONS[0];
    (this.container.querySelector('#inp-desc') as HTMLTextAreaElement).value = item.cleanDescription || item.description || '';
    (this.container.querySelector('#inp-refs') as HTMLInputElement).value = (item.referenceCodes || []).join(', ');
    (this.container.querySelector('#inp-price') as HTMLInputElement).value = item.price !== null ? item.price.toString() : '';
    (this.container.querySelector('#inp-stock') as HTMLInputElement).value = item.stockQty !== null ? item.stockQty.toString() : '';

    // Montadoras
    const checkboxes = this.container.querySelectorAll<HTMLInputElement>('input[name="mfr"]');
    checkboxes.forEach(cb => {
      cb.checked = (item.manufacturers || []).includes(cb.value);
    });
  }

  private resetFields(): void {
    if (!this.container) return;

    (this.container.querySelector('#inp-box') as HTMLInputElement).value = '';
    (this.container.querySelector('#inp-code') as HTMLInputElement).value = '';
    (this.container.querySelector('#sel-section') as HTMLSelectElement).value = CATALOG_SECTIONS[0];
    (this.container.querySelector('#inp-desc') as HTMLTextAreaElement).value = '';
    (this.container.querySelector('#inp-refs') as HTMLInputElement).value = '';
    (this.container.querySelector('#inp-price') as HTMLInputElement).value = '';
    (this.container.querySelector('#inp-stock') as HTMLInputElement).value = '';

    const checkboxes = this.container.querySelectorAll<HTMLInputElement>('input[name="mfr"]');
    checkboxes.forEach(cb => {
      cb.checked = cb.value === 'Universal';
    });
  }

  private async handleSave(): Promise<void> {
    if (!this.container) return;

    const boxInput = this.container.querySelector('#inp-box') as HTMLInputElement;
    const descInput = this.container.querySelector('#inp-desc') as HTMLTextAreaElement;

    if (!boxInput.value.trim() && !descInput.value.trim() && this.currentImages.length === 0) {
      alert('Informe ao menos a Caixa, a Descrição ou anexe uma Foto.');
      return;
    }

    const codeInput = this.container.querySelector('#inp-code') as HTMLInputElement;
    const sectionSelect = this.container.querySelector('#sel-section') as HTMLSelectElement;
    const refsInput = this.container.querySelector('#inp-refs') as HTMLInputElement;
    const priceInput = this.container.querySelector('#inp-price') as HTMLInputElement;
    const stockInput = this.container.querySelector('#inp-stock') as HTMLInputElement;

    const selectedMfrs: string[] = [];
    this.container.querySelectorAll<HTMLInputElement>('input[name="mfr"]:checked').forEach(cb => {
      selectedMfrs.push(cb.value);
    });
    if (selectedMfrs.length === 0) selectedMfrs.push('Universal');

    const refs = refsInput.value.split(',').map(r => r.trim()).filter(r => r.length > 0);
    const price = priceInput.value ? parseFloat(priceInput.value) : null;
    const stockQty = stockInput.value ? parseInt(stockInput.value, 10) : null;

    const now = new Date().toISOString();
    const itemId = this.currentItem ? this.currentItem.id : `custom_${Date.now()}`;

    const savedProduct: CatalogItem = {
      id: itemId,
      catalogSource: this.currentItem ? this.currentItem.catalogSource : 'Manual Balcão',
      section: sectionSelect.value,
      boxNumber: boxInput.value.trim(),
      internalCode: codeInput.value.trim(),
      referenceCodes: refs,
      description: descInput.value.trim(),
      cleanDescription: descInput.value.trim(),
      manufacturers: selectedMfrs,
      technicalSpecs: this.currentItem?.technicalSpecs || [],
      images: this.currentImages,
      primaryImage: this.currentImages.length > 0 ? this.currentImages[0] : null,
      needsDescriptionReview: false,
      price,
      stockQty,
      searchTokens: [],
      createdAt: this.currentItem ? this.currentItem.createdAt : now,
      updatedAt: now,
      isCustom: this.currentItem ? this.currentItem.isCustom : true,
      isEdited: true
    };

    // Salva no IndexedDB
    await dbService.saveProduct(savedProduct);

    if (this.onSaveCallback) {
      this.onSaveCallback(savedProduct);
    }

    this.close();
  }

  private handleDuplicate(): void {
    if (!this.container) return;
    const descInput = this.container.querySelector('#inp-desc') as HTMLTextAreaElement;
    descInput.value = `${descInput.value.trim()} (Cópia)`;
    this.currentItem = null;
    const titleEl = this.container.querySelector('#modal-title');
    if (titleEl) titleEl.textContent = 'Nova Peça (Duplicada)';
  }

  private async handleDelete(): Promise<void> {
    if (!this.currentItem || !confirm('Tem certeza que deseja excluir esta peça?')) return;
    await dbService.deleteProduct(this.currentItem.id);
    if (this.onSaveCallback) {
      this.onSaveCallback(this.currentItem);
    }
    this.close();
  }
}
