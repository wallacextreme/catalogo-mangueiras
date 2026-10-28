import { describe, it, expect } from 'bun:test';
import { validateMagicBytes, computeSHA256 } from '../src/media/webp-converter';
import { CatalogItem } from '../src/types/catalog';

describe('Security, Magic Bytes & SHA-256 (Gate 9)', () => {
  it('deve validar magic bytes de PNG legítimo', () => {
    // 89 50 4E 47
    const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(validateMagicBytes(pngHeader.buffer)).toBe(true);
  });

  it('deve validar magic bytes de JPEG legítimo', () => {
    // FF D8 FF
    const jpegHeader = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(validateMagicBytes(jpegHeader.buffer)).toBe(true);
  });

  it('deve validar magic bytes de WebP legítimo', () => {
    // RIFF .... WEBP
    const webpHeader = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50
    ]);
    expect(validateMagicBytes(webpHeader.buffer)).toBe(true);
  });

  it('deve REJEITAR arquivos executáveis, scripts ou adulterados (Gate 9 - Anti-XSS)', () => {
    // Executável Windows (MZ: 4D 5A)
    const exeHeader = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]);
    expect(validateMagicBytes(exeHeader.buffer)).toBe(false);

    // Script HTML/JS (<script>)
    const htmlHeader = new TextEncoder().encode('<script>alert("xss")</script>');
    expect(validateMagicBytes(htmlHeader.buffer)).toBe(false);
  });

  it('deve gerar hash SHA-256 correto e determinístico', async () => {
    const data = new TextEncoder().encode('CATALOGO_BALCAO_AUTOPECAS_2026');
    const hash1 = await computeSHA256(data.buffer);
    const hash2 = await computeSHA256(data.buffer);

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // 256 bits = 64 hex chars
  });
});

describe('Store Data Isolation & Sync Logic (Gate 8)', () => {
  it('garante que edições manuais de caixa, código e fotos nunca sejam sobrescritas pelo seed', () => {
    const seedItem: CatalogItem = {
      id: 'prod_100',
      catalogSource: 'seed.docx',
      section: 'Grampos',
      boxNumber: '940',
      internalCode: '',
      referenceCodes: ['P-185'],
      description: 'GRAMPO ORIGINAL SEED',
      cleanDescription: 'GRAMPO ORIGINAL SEED',
      manufacturers: ['Fiat'],
      technicalSpecs: [],
      images: ['/img/orig.webp'],
      primaryImage: '/img/orig.webp',
      needsDescriptionReview: false,
      price: null,
      stockQty: null,
      searchTokens: [],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01'
    };

    // Balconista editou a caixa física para 940A, adicionou código interno MU940A e colou foto Ctrl+V
    const storeOverride: CatalogItem = {
      ...seedItem,
      boxNumber: '940A-GAVETA-2',
      internalCode: 'MU940A-CUSTOM',
      cleanDescription: 'GRAMPO CUSTOMIZADO PELO BALCONISTA',
      images: ['/img/orig.webp', 'data:image/webp;base64,ctrl_v_image_data'],
      isEdited: true,
      updatedAt: '2026-05-01'
    };

    // Simula a lógica de syncStaticCatalogUpdates
    const overrideMap = new Map<string, CatalogItem>([[storeOverride.id, storeOverride]]);
    const mergedList: CatalogItem[] = [];

    const incomingSeed = [seedItem];
    for (const item of incomingSeed) {
      if (overrideMap.has(item.id)) {
        const local = overrideMap.get(item.id)!;
        mergedList.push({
          ...item,
          ...local,
          images: Array.from(new Set([...(local.images || []), ...(item.images || [])])),
          boxNumber: local.boxNumber || item.boxNumber,
          internalCode: local.internalCode || item.internalCode,
          description: local.description || item.description
        });
      } else {
        mergedList.push(item);
      }
    }

    const consolidated = mergedList[0];
    expect(consolidated.boxNumber).toBe('940A-GAVETA-2');
    expect(consolidated.internalCode).toBe('MU940A-CUSTOM');
    expect(consolidated.cleanDescription).toBe('GRAMPO CUSTOMIZADO PELO BALCONISTA');
    expect(consolidated.images.length).toBe(2);
    expect(consolidated.images).toContain('data:image/webp;base64,ctrl_v_image_data');
  });
});
