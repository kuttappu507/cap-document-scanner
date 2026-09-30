import { ScannerMode } from '../plugins/document-scanner';

export interface ScanSettings {
  pageLimit: number;
  imageQuality: number;
  generatePdf: boolean;
  androidScannerMode: ScannerMode;
  androidGalleryImportAllowed: boolean;
  saveToFiles: boolean;
  saveToPhotos: boolean;
}
