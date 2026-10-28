import { describe, it, expect } from 'bun:test';
import { SearchEngine, normalizeText } from '../src/search/search-engine';
import { CatalogItem, FilterState } from '../src/types/catalog';

const mockHoseItems: CatalogItem[] = [
  {
    id: 'mang_fiat_r0_left',
    catalogSource: 'MANGUEIRAS LINHA FIAT.docx',
    lineName: 'Linha Fiat',
    hoseType: 'Filtro de Ar',
    section: 'Filtro de Ar',
    boxNumber: '384',
    internalCode: '',
    referenceCodes: ['21926-9', '51854599'],
    description: '21926-9 MANGUEIRA DO FILTRO DE AR FIORINO/GRAND SIENA/PALIO/UNO/STRADA/MOBI MOTOR FIRE EVO 51854599',
    cleanDescription: '21926-9 MANGUEIRA DO FILTRO DE AR FIORINO/GRAND SIENA/PALIO/UNO/STRADA/MOBI MOTOR FIRE EVO 51854599',
    manufacturers: ['Fiat'],
    technicalSpecs: ['FIRE', 'EVO'],
    images: ['/catalog-images/mangueiras/mang_fiat_r0_left.webp'],
    primaryImage: '/catalog-images/mangueiras/mang_fiat_r0_left.webp',
    needsDescriptionReview: false,
    price: 45.0,
    stockQty: 12,
    searchTokens: ['384', '21926-9', '219269', '51854599', 'mangueira', 'filtro', 'ar', 'palio', 'uno', 'fiat'],
    createdAt: '2026-10-28T00:00:00Z',
    updatedAt: '2026-10-28T00:00:00Z'
  },
  {
    id: 'mang_gm_r0_left',
    catalogSource: 'MANGUEIRAS LINHA GM.docx',
    lineName: 'Linha GM',
    hoseType: 'Bocal do Tanque / Combustível',
    section: 'Bocal do Tanque / Combustível',
    boxNumber: '412',
    internalCode: '',
    referenceCodes: ['15050-0'],
    description: '15050-0 MANGUEIRA DO BOCAL DO TANQUE DE COMBUSTÍVEL (49X135MM) OPALA/CARAVAN 90/92',
    cleanDescription: '15050-0 MANGUEIRA DO BOCAL DO TANQUE DE COMBUSTÍVEL (49X135MM) OPALA/CARAVAN 90/92',
    manufacturers: ['GM'],
    technicalSpecs: ['49X135MM'],
    images: ['/catalog-images/mangueiras/mang_gm_r0_left.webp'],
    primaryImage: '/catalog-images/mangueiras/mang_gm_r0_left.webp',
    needsDescriptionReview: false,
    price: 38.0,
    stockQty: 8,
    searchTokens: ['412', '15050-0', '150500', 'bocal', 'tanque', 'opala', 'caravan', 'gm'],
    createdAt: '2026-10-28T00:00:00Z',
    updatedAt: '2026-10-28T00:00:00Z'
  },
  {
    id: 'mang_vw_r1_left',
    catalogSource: 'MANGUEIRAS LINHA VOLKSWAGEN.docx',
    lineName: 'Linha Volkswagen',
    hoseType: 'Respiro de Óleo / Antichama',
    section: 'Respiro de Óleo / Antichama',
    boxNumber: '16',
    internalCode: '',
    referenceCodes: ['15260-3'],
    description: '15260-3 MANGUEIRA DO RESPIRO ÓLEO BRASILIA',
    cleanDescription: '15260-3 MANGUEIRA DO RESPIRO ÓLEO BRASILIA',
    manufacturers: ['VW'],
    technicalSpecs: [],
    images: ['/catalog-images/mangueiras/mang_vw_r1_left.webp'],
    primaryImage: '/catalog-images/mangueiras/mang_vw_r1_left.webp',
    needsDescriptionReview: false,
    price: 25.0,
    stockQty: 15,
    searchTokens: ['16', '15260-3', '152603', 'respiro', 'oleo', 'brasilia', 'vw'],
    createdAt: '2026-10-28T00:00:00Z',
    updatedAt: '2026-10-28T00:00:00Z'
  }
];

describe('SearchEngine - Balcão de Mangueiras Automotivas', () => {
  const engine = new SearchEngine(mockHoseItems);

  const baseFilter: FilterState = {
    searchQuery: '',
    selectedSection: '',
    selectedManufacturer: '',
    visualStatus: 'all',
    viewMode: 'grid',
    hidePrices: false,
    sortBy: 'box'
  };

  it('deve localizar mangueira pelo número exato da caixa (384)', () => {
    const results = engine.search({ ...baseFilter, searchQuery: '384' });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].boxNumber).toBe('384');
  });

  it('deve localizar mangueira digitando "cx 412"', () => {
    const results = engine.search({ ...baseFilter, searchQuery: 'cx 412' });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].boxNumber).toBe('412');
  });

  it('deve localizar mangueira pelo código de referência 21926-9', () => {
    const res = engine.search({ ...baseFilter, searchQuery: '21926-9' });
    expect(res.length).toBeGreaterThan(0);
    expect(res[0].referenceCodes).toContain('21926-9');
  });

  it('deve localizar mangueira digitando o código OEM 51854599', () => {
    const res = engine.search({ ...baseFilter, searchQuery: '51854599' });
    expect(res.length).toBeGreaterThan(0);
    expect(res[0].boxNumber).toBe('384');
  });

  it('deve localizar mangueira por modelo do veículo (Opala)', () => {
    const res = engine.search({ ...baseFilter, searchQuery: 'opala' });
    expect(res.length).toBeGreaterThan(0);
    expect(res[0].boxNumber).toBe('412');
  });

  it('deve filtrar por Seção / Tipo de Mangueira (Filtro de Ar)', () => {
    const res = engine.search({ ...baseFilter, selectedSection: 'Filtro de Ar' });
    expect(res.length).toBe(1);
    expect(res[0].section).toBe('Filtro de Ar');
  });

  it('deve filtrar por Montadora (GM)', () => {
    const res = engine.search({ ...baseFilter, selectedManufacturer: 'GM' });
    expect(res.length).toBe(1);
    expect(res[0].boxNumber).toBe('412');
  });

  it('Quality Gate 9: benchmark de busca de mangueiras deve responder em < 50ms', () => {
    const largeList: CatalogItem[] = [];
    for (let i = 0; i < 1500; i++) {
      largeList.push({
        ...mockHoseItems[i % 3],
        id: `mang_synth_${i}`,
        boxNumber: `BOX_${i}`,
        cleanDescription: `Mangueira Sintética de Teste ${i} do Radiador Superior`
      });
    }

    const perfEngine = new SearchEngine(largeList);
    const start = performance.now();

    for (let j = 0; j < 100; j++) {
      perfEngine.search({ ...baseFilter, searchQuery: `BOX_${j * 10}` });
    }

    const elapsed = performance.now() - start;
    const avgTimeMs = elapsed / 100;

    console.log(`[Gate 9 Mangueiras] 100 buscas em 1500 itens: Média = ${avgTimeMs.toFixed(3)} ms`);
    expect(avgTimeMs).toBeLessThan(50);
  });
});
