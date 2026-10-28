import { describe, it, expect } from 'bun:test';
import { SearchEngine, normalizeText } from '../src/search/search-engine';
import { CatalogItem, FilterState } from '../src/types/catalog';

const mockItems: CatalogItem[] = [
  {
    id: 'item_1',
    catalogSource: 'doc1.docx',
    section: 'Grampos, Presilhas, Batentes e Acabamentos',
    boxNumber: '940',
    internalCode: 'MU940',
    referenceCodes: ['P-185', 'P185'],
    description: 'GRAMPO SUPERIOR BAGAGITO C3/C4',
    cleanDescription: 'GRAMPO SUPERIOR BAGAGITO C3/C4',
    manufacturers: ['Peugeot/Citroën'],
    technicalSpecs: ['8mm'],
    images: ['/catalog-images/miudezas/img1.webp'],
    primaryImage: '/catalog-images/miudezas/img1.webp',
    needsDescriptionReview: false,
    price: 15.0,
    stockQty: 50,
    searchTokens: ['940', 'mu940', 'p185', 'grampo', 'bagagito', 'c3', 'c4'],
    createdAt: '2026-10-28T00:00:00Z',
    updatedAt: '2026-10-28T00:00:00Z'
  },
  {
    id: 'item_2',
    catalogSource: 'doc2.docx',
    section: 'Reparos de Trambulador e Câmbio',
    boxNumber: '10309',
    internalCode: 'MU10309',
    referenceCodes: ['LF0437', 'D100.83'],
    description: 'REPARO TRAMBULADOR CORSA/CELTA 5 MARCHAS',
    cleanDescription: 'REPARO TRAMBULADOR CORSA/CELTA 5 MARCHAS',
    manufacturers: ['GM'],
    technicalSpecs: [],
    images: ['/catalog-images/miudezas/img2.webp'],
    primaryImage: '/catalog-images/miudezas/img2.webp',
    needsDescriptionReview: false,
    price: 32.5,
    stockQty: 20,
    searchTokens: ['10309', 'mu10309', 'lf0437', 'reparo', 'trambulador', 'corsa'],
    createdAt: '2026-10-28T00:00:00Z',
    updatedAt: '2026-10-28T00:00:00Z'
  },
  {
    id: 'item_3',
    catalogSource: 'doc2.docx',
    section: 'Reparos de Trambulador e Câmbio',
    boxNumber: '1048B',
    internalCode: 'LT-2340',
    referenceCodes: ['JAHU 08271-9'],
    description: 'TERMINAL DO CABO ENGATE AGILE/PRISMA',
    cleanDescription: 'TERMINAL DO CABO ENGATE AGILE/PRISMA',
    manufacturers: ['GM'],
    technicalSpecs: ['M10'],
    images: [],
    primaryImage: null,
    needsDescriptionReview: true,
    price: null,
    stockQty: null,
    searchTokens: ['1048b', 'lt2340', 'jahu', 'terminal', 'cabo'],
    createdAt: '2026-10-28T00:00:00Z',
    updatedAt: '2026-10-28T00:00:00Z'
  }
];

describe('SearchEngine - Balcão de Alta Velocidade', () => {
  const engine = new SearchEngine(mockItems);

  const baseFilter: FilterState = {
    searchQuery: '',
    selectedSection: '',
    selectedManufacturer: '',
    visualStatus: 'all',
    viewMode: 'grid',
    hidePrices: false,
    sortBy: 'box'
  };

  it('deve localizar produto pelo número exato da caixa (940)', () => {
    const results = engine.search({ ...baseFilter, searchQuery: '940' });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].boxNumber).toBe('940');
  });

  it('deve localizar produto digitando "cx 10309"', () => {
    const results = engine.search({ ...baseFilter, searchQuery: 'cx 10309' });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].boxNumber).toBe('10309');
  });

  it('deve localizar produto com caixa alfanumérica (1048B)', () => {
    const results = engine.search({ ...baseFilter, searchQuery: '1048b' });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].boxNumber).toBe('1048B');
  });

  it('deve localizar produto pelo código interno MU10309 e LT-2340', () => {
    const res1 = engine.search({ ...baseFilter, searchQuery: 'MU10309' });
    expect(res1.length).toBeGreaterThan(0);
    expect(res1[0].internalCode).toBe('MU10309');

    const res2 = engine.search({ ...baseFilter, searchQuery: 'lt2340' });
    expect(res2.length).toBeGreaterThan(0);
    expect(res2[0].internalCode).toBe('LT-2340');
  });

  it('deve localizar produto pelos códigos de referência P-185 e LF0437', () => {
    const resP = engine.search({ ...baseFilter, searchQuery: 'P-185' });
    expect(resP.length).toBeGreaterThan(0);
    expect(resP[0].referenceCodes).toContain('P-185');

    const resLF = engine.search({ ...baseFilter, searchQuery: 'lf0437' });
    expect(resLF.length).toBeGreaterThan(0);
    expect(resLF[0].referenceCodes).toContain('LF0437');
  });

  it('deve filtrar por Categoria / Seção', () => {
    const res = engine.search({ ...baseFilter, selectedSection: 'Reparos de Trambulador e Câmbio' });
    expect(res.length).toBe(2);
    expect(res.every(r => r.section === 'Reparos de Trambulador e Câmbio')).toBe(true);
  });

  it('deve filtrar por Montadora (GM)', () => {
    const res = engine.search({ ...baseFilter, selectedManufacturer: 'GM' });
    expect(res.length).toBe(2);
    expect(res.every(r => r.manufacturers.includes('GM'))).toBe(true);
  });

  it('deve filtrar por Status Visual (apenas itens com foto)', () => {
    const res = engine.search({ ...baseFilter, visualStatus: 'with-photo' });
    expect(res.length).toBe(2);
    expect(res.every(r => r.primaryImage !== null)).toBe(true);
  });

  it('Quality Gate 9: benchmark de busca deve responder em < 50ms', () => {
    // Cria 1500 itens sintéticos
    const largeList: CatalogItem[] = [];
    for (let i = 0; i < 1500; i++) {
      largeList.push({
        ...mockItems[i % 3],
        id: `synth_${i}`,
        boxNumber: `BOX_${i}`,
        internalCode: `MU${i}`,
        cleanDescription: `Peça de Teste Sintética número ${i} com especificações M${i}`
      });
    }

    const perfEngine = new SearchEngine(largeList);
    const start = performance.now();

    // 100 buscas consecutivas
    for (let j = 0; j < 100; j++) {
      perfEngine.search({ ...baseFilter, searchQuery: `BOX_${j * 10}` });
    }

    const elapsed = performance.now() - start;
    const avgTimeMs = elapsed / 100;

    console.log(`[Gate 9 Perf] 100 buscas em 1500 itens: Média = ${avgTimeMs.toFixed(3)} ms por busca.`);
    expect(avgTimeMs).toBeLessThan(50);
  });
});
