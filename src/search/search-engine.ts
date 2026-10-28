/**
 * src/search/search-engine.ts
 * Motor de busca ultrarrápido (< 50ms) especializado para balcão de miudezas automotivas.
 * Suporta busca por número de caixa, código interno, códigos de referência, medidas e termos técnicos.
 */

import { CatalogItem, FilterState } from '../types/catalog';

export function normalizeText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface IndexedItem {
  item: CatalogItem;
  normBox: string;
  normInternalCode: string;
  normInternalCodeNoDash: string;
  normRefs: string[];
  normRefsNoDash: string[];
  normDesc: string;
  normSection: string;
  normMfrs: string[];
  searchIndex: string;
}

export class SearchEngine {
  private indexedItems: IndexedItem[] = [];

  constructor(items: CatalogItem[] = []) {
    this.buildIndex(items);
  }

  public buildIndex(items: CatalogItem[]): void {
    this.indexedItems = items.map(item => {
      const normBox = normalizeText(item.boxNumber);
      const normInternalCode = normalizeText(item.internalCode);
      const normInternalCodeNoDash = normInternalCode.replace(/\s+/g, '');

      const normRefs = (item.referenceCodes || []).map(r => normalizeText(r));
      const normRefsNoDash = normRefs.map(r => r.replace(/\s+/g, ''));

      const normDesc = normalizeText(item.description);
      const normSection = normalizeText(item.section);
      const normMfrs = (item.manufacturers || []).map(m => normalizeText(m));
      const normSpecs = (item.technicalSpecs || []).map(s => normalizeText(s));

      const combinedIndex = [
        normBox,
        `cx ${normBox}`,
        `caixa ${normBox}`,
        normInternalCode,
        normInternalCodeNoDash,
        ...normRefs,
        ...normRefsNoDash,
        normDesc,
        normSection,
        ...normMfrs,
        ...normSpecs
      ].join(' ');

      return {
        item,
        normBox,
        normInternalCode,
        normInternalCodeNoDash,
        normRefs,
        normRefsNoDash,
        normDesc,
        normSection,
        normMfrs,
        searchIndex: combinedIndex
      };
    });
  }

  /**
   * Executa a busca em menos de 50ms com pontuação inteligente de relevância.
   */
  public search(filter: FilterState): CatalogItem[] {
    const rawQuery = filter.searchQuery.trim();
    const normQuery = normalizeText(rawQuery);
    const queryTerms = normQuery.split(' ').filter(t => t.length > 0);

    const hasQuery = queryTerms.length > 0;
    const cleanBoxQuery = normQuery.replace(/^(cx|caixa)\s*/, '');

    const results: { item: CatalogItem; score: number }[] = [];

    for (const indexed of this.indexedItems) {
      const { item } = indexed;

      // 1. Filtro por Categoria / Seção
      if (filter.selectedSection && item.section !== filter.selectedSection) {
        continue;
      }

      // 2. Filtro por Montadora
      if (filter.selectedManufacturer && !(item.manufacturers || []).includes(filter.selectedManufacturer)) {
        continue;
      }

      // 3. Filtro por Status Visual
      if (filter.visualStatus === 'with-photo') {
        if (!item.primaryImage && (!item.images || item.images.length === 0)) continue;
      } else if (filter.visualStatus === 'without-photo') {
        if (item.primaryImage || (item.images && item.images.length > 0)) continue;
      } else if (filter.visualStatus === 'visual-only') {
        if (!item.needsDescriptionReview) continue;
      }

      // Se não há texto pesquisado, inclui o item com score neutro
      if (!hasQuery) {
        results.push({ item, score: 1 });
        continue;
      }

      // 4. Verificação de termos pesquisados (todos os termos devem coincidir)
      let matchesAllTerms = true;
      let score = 0;

      for (const term of queryTerms) {
        if (!indexed.searchIndex.includes(term)) {
          matchesAllTerms = false;
          break;
        }
      }

      if (!matchesAllTerms) {
        continue;
      }

      // 5. Cálculo de relevância para balcão
      // A. Coincidência EXATA do Número da Caixa (ex: digitou "940" ou "Cx 940" -> prioridade 1 absoluta)
      if (cleanBoxQuery && indexed.normBox === cleanBoxQuery) {
        score += 5000;
      } else if (cleanBoxQuery && indexed.normBox.startsWith(cleanBoxQuery)) {
        score += 2500;
      }

      // B. Coincidência no Código Interno (ex: "MU392", "LT-2340")
      const termCompact = normQuery.replace(/\s+/g, '');
      if (indexed.normInternalCodeNoDash && indexed.normInternalCodeNoDash === termCompact) {
        score += 4000;
      } else if (indexed.normInternalCodeNoDash && indexed.normInternalCodeNoDash.includes(termCompact)) {
        score += 2000;
      }

      // C. Coincidência em Códigos de Referência (ex: "P-185", "LF0437")
      for (const ref of indexed.normRefsNoDash) {
        if (ref === termCompact) {
          score += 3000;
          break;
        } else if (ref.includes(termCompact)) {
          score += 1500;
          break;
        }
      }

      // D. Coincidência na Descrição
      if (indexed.normDesc.includes(normQuery)) {
        score += 1000;
      }

      results.push({ item, score });
    }

    // Ordenação dos resultados
    if (hasQuery) {
      // Ordena por score decrescente
      results.sort((a, b) => b.score - a.score);
    } else {
      // Ordenação selecionada
      if (filter.sortBy === 'box') {
        results.sort((a, b) => (a.item.boxNumber || '').localeCompare(b.item.boxNumber || '', undefined, { numeric: true }));
      } else if (filter.sortBy === 'code') {
        results.sort((a, b) => (a.item.internalCode || '').localeCompare(b.item.internalCode || ''));
      } else if (filter.sortBy === 'description') {
        results.sort((a, b) => a.item.cleanDescription.localeCompare(b.item.cleanDescription));
      } else if (filter.sortBy === 'section') {
        results.sort((a, b) => a.item.section.localeCompare(b.item.section));
      }
    }

    return results.map(r => r.item);
  }
}
