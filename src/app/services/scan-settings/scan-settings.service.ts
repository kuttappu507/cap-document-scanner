import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { ScannerMode } from '@capawesome-team/capacitor-document-scanner';
import { StorageKeys } from '../../enums/storage-keys.enum';
import { ScanSettings } from '../../interfaces/scan-settings.interface';

export const DEFAULT_SCAN_SETTINGS: ScanSettings = {
  pageLimit: 10,
  imageQuality: 90,
  generatePdf: true,
  androidScannerMode: ScannerMode.Full,
  androidGalleryImportAllowed: true,
  saveToFiles: true,
  saveToPhotos: false,
};

/** Owns the user's scanner defaults and persists them between launches. */
@Injectable({ providedIn: 'root' })
export class ScanSettingsService {
  private readonly _settings = signal<ScanSettings>(DEFAULT_SCAN_SETTINGS);
  private loaded = false;

  readonly settings = this._settings.asReadonly();

  async load(): Promise<void> {
    if (this.loaded) {
      return;
    }
    const { value } = await Preferences.get({ key: StorageKeys.ScanSettings });
    if (value) {
      this._settings.set({ ...DEFAULT_SCAN_SETTINGS, ...(JSON.parse(value) as Partial<ScanSettings>) });
    }
    this.loaded = true;
  }

  async update(patch: Partial<ScanSettings>): Promise<void> {
    this._settings.update((current) => ({ ...current, ...patch }));
    await Preferences.set({ key: StorageKeys.ScanSettings, value: JSON.stringify(this._settings()) });
  }

  async reset(): Promise<void> {
    await this.update(DEFAULT_SCAN_SETTINGS);
  }
}
