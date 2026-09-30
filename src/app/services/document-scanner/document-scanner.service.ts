import { Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { DocumentScanner, ErrorCode } from '../../plugins/document-scanner';
import { ScanResult } from '../../interfaces/scan-result.interface';
import { ScanSettings } from '../../interfaces/scan-settings.interface';

@Injectable({ providedIn: 'root' })
export class DocumentScannerService {
  private readonly _available = signal<boolean | null>(null);
  readonly available = this._available.asReadonly();

  async checkAvailability(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      this._available.set(false);
      return false;
    }
    try {
      const { available } = await DocumentScanner.isAvailable();
      this._available.set(available);
      return available;
    } catch {
      this._available.set(false);
      return false;
    }
  }

  async scan(settings: ScanSettings): Promise<ScanResult | null> {
    try {
      const { scannedImages, pdf } = await DocumentScanner.scanDocument({
        pageLimit: settings.pageLimit,
        imageQuality: settings.imageQuality,
        generatePdf: settings.generatePdf,
        androidScannerMode: settings.androidScannerMode,
        androidGalleryImportAllowed: settings.androidGalleryImportAllowed,
      });
      return { images: scannedImages, pdf };
    } catch (error) {
      if ((error as { code?: string } | null)?.code === ErrorCode.ScanCanceled) {
        return null;
      }
      throw error;
    }
  }
}
