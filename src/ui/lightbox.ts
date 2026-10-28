/**
 * src/ui/lightbox.ts
 * Visualizador Lightbox de Alta Resolução com Zoom (50% a 400%),
 * Rotação 90° e Carrossel Multi-Ângulos para Balcão.
 */

import { CatalogItem } from '../types/catalog';
import { Icons } from './icons';
import { resolveAssetUrl } from '../media/asset-url';

export class LightboxModal {
  private container: HTMLDivElement | null = null;
  private currentItem: CatalogItem | null = null;
  private currentImageIndex = 0;
  private currentZoom = 1.0;
  private currentRotation = 0;

  constructor() {
    this.createDom();
  }

  private createDom(): void {
    this.container = document.createElement('div');
    this.container.id = 'lightbox-modal';
    this.container.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm transition-opacity duration-200 hidden select-none';

    this.container.innerHTML = `
      <!-- Barra Superior com Ações -->
      <div class="absolute top-0 left-0 right-0 p-4 flex items-center justify-between text-white bg-gradient-to-b from-black/80 to-transparent z-10">
        <div class="flex items-center gap-3">
          <div class="bg-amber-500 text-slate-950 font-mono font-black text-sm px-2.5 py-1 rounded shadow" id="lb-box-badge">
            CAIXA
          </div>
          <span class="font-bold text-sm text-slate-100 max-w-md truncate" id="lb-title">Título</span>
        </div>

        <div class="flex items-center gap-2">
          <!-- Controles de Zoom -->
          <button id="lb-zoom-out" class="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors" title="Diminuir Zoom">
            ${Icons.zoomOut('w-5 h-5')}
          </button>
          <span id="lb-zoom-level" class="font-mono text-xs font-bold w-12 text-center text-slate-300">100%</span>
          <button id="lb-zoom-in" class="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors" title="Aumentar Zoom (até 400%)">
            ${Icons.zoomIn('w-5 h-5')}
          </button>
          <button id="lb-rotate" class="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors" title="Girar 90°">
            ${Icons.rotateCw('w-5 h-5')}
          </button>
          <button id="lb-close" class="p-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition-colors ml-2" title="Fechar (Esc)">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>
      </div>

      <!-- Área Central da Imagem -->
      <div class="relative w-full h-full flex items-center justify-center p-8 overflow-hidden" id="lb-stage">
        <img id="lb-image" src="" alt="Peça ampliada" class="max-h-[85vh] max-w-[85vw] object-contain transition-transform duration-100 filter drop-shadow-2xl cursor-grab" />
      </div>

      <!-- Navegação Entre Ângulos (se houver mais de uma foto) -->
      <button id="lb-prev" class="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors hidden shadow-lg" title="Foto Anterior (Seta Esquerda)">
        ${Icons.copy('w-6 h-6 rotate-180')}
      </button>
      <button id="lb-next" class="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors hidden shadow-lg" title="Próxima Foto (Seta Direita)">
        ${Icons.copy('w-6 h-6')}
      </button>

      <!-- Contador de Fotos Inferior -->
      <div class="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-white font-mono text-xs font-semibold" id="lb-counter">
        1 / 1
      </div>
    `;

    document.body.appendChild(this.container);
    this.bindEvents();
  }

  private bindEvents(): void {
    if (!this.container) return;

    this.container.querySelector('#lb-close')?.addEventListener('click', () => this.close());
    this.container.querySelector('#lb-zoom-in')?.addEventListener('click', () => this.setZoom(this.currentZoom + 0.5));
    this.container.querySelector('#lb-zoom-out')?.addEventListener('click', () => this.setZoom(this.currentZoom - 0.5));
    this.container.querySelector('#lb-rotate')?.addEventListener('click', () => {
      this.currentRotation = (this.currentRotation + 90) % 360;
      this.updateTransform();
    });

    this.container.querySelector('#lb-prev')?.addEventListener('click', () => this.navigate(-1));
    this.container.querySelector('#lb-next')?.addEventListener('click', () => this.navigate(1));

    // Fecha ao clicar fora da imagem
    this.container.querySelector('#lb-stage')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.close();
    });

    // Teclado: Esc e setas laterais
    window.addEventListener('keydown', (e) => {
      if (!this.container || this.container.classList.contains('hidden')) return;

      if (e.key === 'Escape') {
        this.close();
      } else if (e.key === 'ArrowLeft') {
        this.navigate(-1);
      } else if (e.key === 'ArrowRight') {
        this.navigate(1);
      }
    });
  }

  public open(item: CatalogItem, imageIndex = 0): void {
    if (!this.container) return;

    this.currentItem = item;
    this.currentImageIndex = imageIndex;
    this.currentZoom = 1.0;
    this.currentRotation = 0;

    const boxBadge = this.container.querySelector('#lb-box-badge');
    if (boxBadge) boxBadge.textContent = item.boxNumber ? `CAIXA ${item.boxNumber}` : 'SEM CAIXA';

    const title = this.container.querySelector('#lb-title');
    if (title) title.textContent = item.cleanDescription;

    this.updateImage();
    this.container.classList.remove('hidden');
  }

  public close(): void {
    if (!this.container) return;
    this.container.classList.add('hidden');
    this.currentItem = null;
  }

  private navigate(direction: number): void {
    if (!this.currentItem || !this.currentItem.images || this.currentItem.images.length <= 1) return;
    const total = this.currentItem.images.length;
    this.currentImageIndex = (this.currentImageIndex + direction + total) % total;
    this.currentZoom = 1.0;
    this.updateImage();
  }

  private updateImage(): void {
    if (!this.container || !this.currentItem) return;

    const images = this.currentItem.images || [];
    const src = images[this.currentImageIndex] || this.currentItem.primaryImage || '';

    const imgEl = this.container.querySelector<HTMLImageElement>('#lb-image');
    if (imgEl) imgEl.src = resolveAssetUrl(src);

    const prevBtn = this.container.querySelector('#lb-prev');
    const nextBtn = this.container.querySelector('#lb-next');
    const counter = this.container.querySelector('#lb-counter');

    if (images.length > 1) {
      prevBtn?.classList.remove('hidden');
      nextBtn?.classList.remove('hidden');
      if (counter) counter.textContent = `${this.currentImageIndex + 1} / ${images.length}`;
    } else {
      prevBtn?.classList.add('hidden');
      nextBtn?.classList.add('hidden');
      if (counter) counter.textContent = '1 / 1';
    }

    this.updateTransform();
  }

  private setZoom(newZoom: number): void {
    // Zoom limitado entre 0.5x e 4.0x
    this.currentZoom = Math.min(4.0, Math.max(0.5, newZoom));
    const label = this.container?.querySelector('#lb-zoom-level');
    if (label) label.textContent = `${Math.round(this.currentZoom * 100)}%`;
    this.updateTransform();
  }

  private updateTransform(): void {
    const imgEl = this.container?.querySelector<HTMLImageElement>('#lb-image');
    if (imgEl) {
      imgEl.style.transform = `scale(${this.currentZoom}) rotate(${this.currentRotation}deg)`;
    }
  }
}
