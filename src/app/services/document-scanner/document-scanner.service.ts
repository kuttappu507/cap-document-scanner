import { Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { DocumentScanner, ErrorCode } from '@capawesome-team/capacitor-document-scanner';
import { ScanResult } from '../../interfaces/scan-result.interface';
import { ScanSettings } from '../../interfaces/scan-settings.interface';

/**
 * Thin adapter around the Capawesome Document Scanner plugin.
 * Single responsibility: talk to the native scanner. It knows nothing about
 * storage, the library, or the UI.
 */
@Injectable({ providedIn: 'root' })
export class DocumentScannerService {
  private readonly _available = signal<boolean | null>(null);

  /** `null` while checking, then `true`/`false`. */
  readonly available = this._available.asReadonly();

  /**
   * Checks whether the device can scan. The plugin only runs on Android and iOS,
   * so the web build short-circuits to `false` instead of hitting "unimplemented".
   */
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

  /**
   * Opens the native full-screen scanner.
   * Resolves `null` when the user cancels — cancelling is a normal outcome, not an error.
   */
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
      if (this.isCancellation(error)) {
        return null;
      }
      throw error;
    }
  }

  private isCancellation(error: unknown): boolean {
    return (error as { code?: string } | null)?.code === ErrorCode.ScanCanceled;
  }
}
