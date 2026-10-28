/**
 * src/storage/indexeddb-service.ts
 * Persistência blindada no IndexedDB com isolamento inviolável dos dados da loja (Gate 8).
 * Suporte a Overrides locais, fotos adicionais Ctrl+V e Backup/Restore com hash SHA-256.
 */

import { CatalogItem, BackupData } from '../types/catalog';
import { computeSHA256 } from '../media/webp-converter';

const DB_NAME = 'BalcaoMiudezasDB';
const DB_VERSION = 1;

const STORES = {
  PRODUCTS: 'products',
  OVERRIDES: 'customOverrides',
  MEDIA: 'mediaStore'
};

class IndexedDBService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
            const productStore = db.createObjectStore(STORES.PRODUCTS, { keyPath: 'id' });
            productStore.createIndex('boxNumber', 'boxNumber', { unique: false });
            productStore.createIndex('internalCode', 'internalCode', { unique: false });
            productStore.createIndex('section', 'section', { unique: false });
          }

          if (!db.objectStoreNames.contains(STORES.OVERRIDES)) {
            db.createObjectStore(STORES.OVERRIDES, { keyPath: 'id' });
          }

          if (!db.objectStoreNames.contains(STORES.MEDIA)) {
            db.createObjectStore(STORES.MEDIA, { keyPath: 'sha256' });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    return this.dbPromise;
  }

  /**
   * Sincroniza o catálogo estático com preservação INVIOLÁVEL de customizações manuais (Gate 8).
   * Se o atendente editou caixa, código, descrição ou adicionou fotos, nada é sobrescrito!
   */
  async syncStaticCatalogUpdates(seedProducts: CatalogItem[]): Promise<CatalogItem[]> {
    const db = await this.getDB();
    const overrides = await this.getAllFromStore<CatalogItem>(STORES.OVERRIDES);
    const overrideMap = new Map<string, CatalogItem>(overrides.map(o => [o.id, o]));

    const mergedProducts: CatalogItem[] = [];

    // Mescla o seed respeitando integralmente os dados editados no balcão
    for (const seedItem of seedProducts) {
      if (overrideMap.has(seedItem.id)) {
        const localOverride = overrideMap.get(seedItem.id)!;
        mergedProducts.push({
          ...seedItem,
          ...localOverride,
          // Garante que imagens adicionadas manualmente não sejam perdidas
          images: Array.from(new Set([...(localOverride.images || []), ...(seedItem.images || [])])),
          primaryImage: localOverride.primaryImage || seedItem.primaryImage,
          boxNumber: localOverride.boxNumber || seedItem.boxNumber,
          internalCode: localOverride.internalCode || seedItem.internalCode,
          description: localOverride.description || seedItem.description,
          isEdited: true
        });
        overrideMap.delete(seedItem.id);
      } else {
        mergedProducts.push(seedItem);
      }
    }

    // Adiciona produtos novos criados localmente na loja que não existiam no seed
    for (const [, customItem] of overrideMap) {
      if (customItem.isCustom) {
        mergedProducts.push(customItem);
      }
    }

    // Persiste no store de produtos consolidados
    const tx = db.transaction(STORES.PRODUCTS, 'readwrite');
    const store = tx.objectStore(STORES.PRODUCTS);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      for (const prod of mergedProducts) {
        store.put(prod);
      }
    });

    return mergedProducts;
  }

  /**
   * Salva alterações manuais de um produto, garantindo seu isolamento no store OVERRIDES.
   */
  async saveProduct(product: CatalogItem): Promise<void> {
    const db = await this.getDB();
    const updatedProduct = {
      ...product,
      isEdited: true,
      updatedAt: new Date().toISOString()
    };

    const tx = db.transaction([STORES.PRODUCTS, STORES.OVERRIDES], 'readwrite');
    tx.objectStore(STORES.PRODUCTS).put(updatedProduct);
    tx.objectStore(STORES.OVERRIDES).put(updatedProduct);

    return new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Remove um produto customizado.
   */
  async deleteProduct(id: string): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction([STORES.PRODUCTS, STORES.OVERRIDES], 'readwrite');
    tx.objectStore(STORES.PRODUCTS).delete(id);
    tx.objectStore(STORES.OVERRIDES).delete(id);

    return new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Retorna todos os produtos do banco.
   */
  async getAllProducts(): Promise<CatalogItem[]> {
    return this.getAllFromStore<CatalogItem>(STORES.PRODUCTS);
  }

  /**
   * Salva imagem WebP adicionada via Ctrl+V ou upload no store de mídia.
   */
  async saveLocalImage(sha256: string, dataUrl: string): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction(STORES.MEDIA, 'readwrite');
    tx.objectStore(STORES.MEDIA).put({ sha256, dataUrl, createdAt: new Date().toISOString() });

    return new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Recupera imagem por hash SHA-256.
   */
  async getLocalImage(sha256: string): Promise<string | null> {
    const db = await this.getDB();
    const tx = db.transaction(STORES.MEDIA, 'readonly');
    const store = tx.objectStore(STORES.MEDIA);
    const req = store.get(sha256);

    return new Promise<string | null>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result ? req.result.dataUrl : null);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Exporta backup completo com checksum SHA-256 de integridade.
   */
  async exportStoreBackup(): Promise<string> {
    const products = await this.getAllProducts();
    const payload = JSON.stringify(products);
    const encoder = new TextEncoder();
    const checksum = await computeSHA256(encoder.encode(payload).buffer);

    const backupData: BackupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      checksum,
      productsCount: products.length,
      products
    };

    return JSON.stringify(backupData, null, 2);
  }

  /**
   * Importa backup validando integridade do hash SHA-256 contra adulterações (Gate 9).
   */
  async importStoreBackup(jsonString: string): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const parsed: BackupData = JSON.parse(jsonString);

      if (!parsed.products || !Array.isArray(parsed.products)) {
        return { success: false, count: 0, error: 'Arquivo de backup inválido: lista de produtos ausente.' };
      }

      // Validação do hash SHA-256 do payload
      const payload = JSON.stringify(parsed.products);
      const encoder = new TextEncoder();
      const calculatedChecksum = await computeSHA256(encoder.encode(payload).buffer);

      if (parsed.checksum && parsed.checksum !== calculatedChecksum) {
        return { success: false, count: 0, error: 'Checksum SHA-256 divergente: o arquivo de backup foi corrompido.' };
      }

      // Salva os produtos importados
      const db = await this.getDB();
      const tx = db.transaction([STORES.PRODUCTS, STORES.OVERRIDES], 'readwrite');
      const prodStore = tx.objectStore(STORES.PRODUCTS);
      const overStore = tx.objectStore(STORES.OVERRIDES);

      for (const item of parsed.products) {
        prodStore.put(item);
        if (item.isEdited || item.isCustom) {
          overStore.put(item);
        }
      }

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });

      return { success: true, count: parsed.products.length };
    } catch (e) {
      return { success: false, count: 0, error: (e as Error).message };
    }
  }

  private async getAllFromStore<T>(storeName: string): Promise<T[]> {
    const db = await this.getDB();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();

    return new Promise<T[]>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  }
}

export const dbService = new IndexedDBService();
