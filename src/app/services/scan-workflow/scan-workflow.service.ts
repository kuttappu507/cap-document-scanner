import { inject, Injectable, signal } from '@angular/core';
import { ScanResult } from '../../interfaces/scan-result.interface';
import { ScanSettings } from '../../interfaces/scan-settings.interface';
import { ScannedDocument } from '../../interfaces/scanned-document.interface';
import { DeviceExportService } from '../device-export/device-export.service';
import { DocumentLibraryService } from '../document-library/document-library.service';
import { DocumentScannerService } from '../document-scanner/document-scanner.service';
import { ScanRecoveryService } from '../scan-recovery/scan-recovery.service';
import { ScanSettingsService } from '../scan-settings/scan-settings.service';

export interface ScanOutcome {
  document: ScannedDocument;
  /** Export steps that failed. The scan itself is still saved in the library. */
  warnings: string[];
}

export type ScanStatus = 'idle' | 'scanning' | 'saving';

/**
 * The end-to-end "scan a document" use case:
 * native scanner → save to the library → auto-save copies per the user's settings.
 * Also resumes a scan whose WebView was restarted while the scanner was open.
 */
@Injectable({ providedIn: 'root' })
export class ScanWorkflowService {
  private readonly scanner = inject(DocumentScannerService);
  private readonly library = inject(DocumentLibraryService);
  private readonly exporter = inject(DeviceExportService);
  private readonly settings = inject(ScanSettingsService);
  private readonly recovery = inject(ScanRecoveryService);
  private readonly _status = signal<ScanStatus>('idle');

  readonly status = this._status.asReadonly();

  /** Resolves `null` when the user cancels the scanner. */
  async scanAndSave(): Promise<ScanOutcome | null> {
    const settings = this.settings.settings();
    this._status.set('scanning');
    try {
      await this.recovery.markStarted(settings);
      const result = await this.scanner.scan(settings);
      await this.recovery.clear();
      return result ? await this.import(result, settings) : null;
    } catch (error) {
      await this.recovery.clear();
      throw error;
    } finally {
      this._status.set('idle');
    }
  }

  /**
   * Call once on app start. If the previous page instance was killed during a
   * scan, waits for the scanner's files and imports them.
   */
  async resumeInterruptedScan(): Promise<ScanOutcome | null> {
    const pending = await this.recovery.getPending();
    if (!pending) {
      return null;
    }
    const result = await this.recovery.waitForFiles(pending);
    if (!result) {
      return null;
    }
    await this.recovery.clear();
    try {
      return await this.import(result, pending.settings);
    } finally {
      this._status.set('idle');
    }
  }

  async saveToFiles(document: ScannedDocument): Promise<ScannedDocument | undefined> {
    const savedToFiles = await this.exporter.saveToFiles(document);
    return this.library.update(document.id, { savedToFiles });
  }

  async saveToPhotos(document: ScannedDocument): Promise<ScannedDocument | undefined> {
    await this.exporter.saveToPhotos(document);
    return this.library.update(document.id, { savedToPhotos: true });
  }

  private async import(result: ScanResult, settings: ScanSettings): Promise<ScanOutcome> {
    if (!result.images?.length) {
      throw new Error('The scanner returned no pages.');
    }
    this._status.set('saving');
    let document = await this.library.add(result);
    await this.recovery.deleteSources(result);
    const warnings: string[] = [];

    if (settings.saveToFiles) {
      document = (await this.saveToFiles(document).catch((error) => {
        warnings.push(`Files: ${describeError(error)}`);
        return document;
      })) ?? document;
    }
    if (settings.saveToPhotos) {
      document = (await this.saveToPhotos(document).catch((error) => {
        warnings.push(`Photos: ${describeError(error)}`);
        return document;
      })) ?? document;
    }
    return { document, warnings };
  }
}

/** Plugin rejections are plain objects with a `message`; normalise them to text. */
export function describeError(error: unknown): string {
  const message = (error as { message?: unknown } | null)?.message;
  return typeof message === 'string' && message ? message : String(error);
}
