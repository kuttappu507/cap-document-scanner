import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, FileInfo, Filesystem } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { StorageKeys } from '../../enums/storage-keys.enum';
import { ScanResult } from '../../interfaces/scan-result.interface';
import { ScanSettings } from '../../interfaces/scan-settings.interface';

/** Prefix the Document Scanner plugin uses for its output files in the cache directory. */
const PLUGIN_FILE_PREFIX = 'capawesome_capacitor_document_scanner_';
const POLL_INTERVAL_MS = 1500;
/** Give up waiting after this long (the user may have cancelled the scanner). */
const MAX_WAIT_MS = 10 * 60 * 1000;

export interface PendingScan {
  startedAt: number;
  settings: ScanSettings;
}

/**
 * Makes scans survive a WebView restart.
 *
 * While the full-screen native scanner is open, the OS may kill the WebView's
 * process to free memory (seen on iOS). Capacitor reloads the page, so the JS
 * promise waiting for the scan is gone and the result would be dropped — but
 * the plugin still writes the scanned files to the cache directory.
 *
 * Before a scan we record that it started. If the app starts with that record
 * present, we watch the cache directory for the plugin's files and import them.
 */
@Injectable({ providedIn: 'root' })
export class ScanRecoveryService {
  async markStarted(settings: ScanSettings): Promise<PendingScan> {
    const pending: PendingScan = { startedAt: Date.now(), settings };
    await Preferences.set({ key: StorageKeys.PendingScan, value: JSON.stringify(pending) });
    return pending;
  }

  async clear(): Promise<void> {
    await Preferences.remove({ key: StorageKeys.PendingScan });
  }

  async getPending(): Promise<PendingScan | null> {
    const { value } = await Preferences.get({ key: StorageKeys.PendingScan });
    return value ? (JSON.parse(value) as PendingScan) : null;
  }

  /**
   * Polls the cache directory until the plugin has finished writing the files of
   * the pending scan. Resolves `null` on timeout or when a newer scan replaces it.
   */
  async waitForFiles(pending: PendingScan): Promise<ScanResult | null> {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }
    let previousSignature = '';
    while (Date.now() - pending.startedAt < MAX_WAIT_MS) {
      const current = await this.getPending();
      if (current?.startedAt !== pending.startedAt) {
        return null; // Cleared, or a new scan has started.
      }
      const files = await this.listScanFiles(pending.startedAt);
      const result = this.toResult(files, pending.settings.generatePdf);
      // Only accept once the file list and sizes are unchanged across two polls (writes finished).
      const signature = files.map((file) => `${file.name}:${file.size}`).join('|');
      if (result && signature === previousSignature) {
        return result;
      }
      previousSignature = signature;
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
    await this.clear();
    return null;
  }

  /** Removes the plugin's cache copies once they are safely imported. */
  async deleteSources(scan: ScanResult): Promise<void> {
    const paths = [...scan.images, ...(scan.pdf ? [scan.pdf] : [])];
    await Promise.all(paths.map((path) => Filesystem.deleteFile({ path }).catch(() => undefined)));
  }

  private async listScanFiles(since: number): Promise<FileInfo[]> {
    try {
      const { files } = await Filesystem.readdir({ path: '', directory: Directory.Cache });
      return files
        .filter((file) => file.type === 'file' && file.name.startsWith(PLUGIN_FILE_PREFIX))
        .filter((file) => (file.ctime ?? file.mtime) >= since - 1000)
        .sort((a, b) => (a.ctime ?? a.mtime) - (b.ctime ?? b.mtime));
    } catch {
      return [];
    }
  }

  private toResult(files: FileInfo[], expectPdf: boolean): ScanResult | null {
    const images = files.filter((file) => file.name.endsWith('.jpg')).map((file) => file.uri);
    const pdf = files.find((file) => file.name.endsWith('.pdf'))?.uri ?? null;
    if (!images.length || (expectPdf && !pdf)) {
      return null;
    }
    return { images, pdf };
  }
}
