/**
 * src/types/catalog.ts
 * Definições de tipos estritos para o Catálogo Interno de Mangueiras Automotivas.
 */

export interface CatalogItem {
  id: string;
  catalogSource: string;
  lineName?: string;
  hoseType?: string;
  section: string;
  boxNumber: string;
  internalCode: string;
  referenceCodes: string[];
  description: string;
  cleanDescription: string;
  manufacturers: string[];
  technicalSpecs: string[];
  images: string[];
  primaryImage: string | null;
  needsDescriptionReview: boolean;
  price: number | null;
  stockQty: number | null;
  searchTokens: string[];
  createdAt: string;
  updatedAt: string;
  isCustom?: boolean;
  isEdited?: boolean;
}

export type ViewMode = 'grid' | 'mural';
export type VisualStatus = 'all' | 'with-photo' | 'without-photo' | 'visual-only';
export type SortOption = 'box' | 'code' | 'description' | 'section';

export interface FilterState {
  searchQuery: string;
  selectedSection: string;
  selectedManufacturer: string;
  visualStatus: VisualStatus;
  viewMode: ViewMode;
  hidePrices: boolean;
  sortBy: SortOption;
}

export interface BackupData {
  version: string;
  exportedAt: string;
  checksum: string;
  productsCount: number;
  products: CatalogItem[];
}
