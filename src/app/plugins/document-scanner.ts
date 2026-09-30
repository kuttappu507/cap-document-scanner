import { registerPlugin } from '@capacitor/core';

export type ScannerMode = 'full' | 'base' | 'filter';

export interface ScanDocumentOptions {
  pageLimit?: number;
  imageQuality?: number;
  generatePdf?: boolean;
  androidScannerMode?: ScannerMode;
  androidGalleryImportAllowed?: boolean;
}

export interface DocumentScannerPlugin {
  isAvailable(): Promise<{ available: boolean }>;
  scanDocument(options?: ScanDocumentOptions): Promise<{
    scannedImages: string[];
    pdf: string | null;
  }>;
}

export enum ErrorCode {
  ScanCanceled = 'SCAN_CANCELED',
}

export const DocumentScanner = registerPlugin<DocumentScannerPlugin>('DocumentScanner');
