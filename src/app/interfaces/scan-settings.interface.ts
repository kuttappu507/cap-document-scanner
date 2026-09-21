import { ScannerMode } from '@capawesome-team/capacitor-document-scanner';

/** User-configurable defaults passed to the native scanner. */
export interface ScanSettings {
  pageLimit: number;
  imageQuality: number;
  generatePdf: boolean;
  androidScannerMode: ScannerMode;
  androidGalleryImportAllowed: boolean;
  /** Copy every new scan to Files (iOS) / Documents (Android). */
  saveToFiles: boolean;
  /** Copy every new scan's pages to Photos / Gallery. */
  saveToPhotos: boolean;
}
