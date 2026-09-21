import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { ScanResult } from '../../interfaces/scan-result.interface';

const SCANS_FOLDER = 'scans';

export interface StoredFiles {
  pages: string[];
  pdf: string | null;
}

/** Private app directory for the library. Hidden from the user (unlike Documents on iOS). */
export const LIBRARY_DIRECTORY = Directory.Library;

/**
 * Moves scanned files out of the cache directory (which the plugin cleans up)
 * into the app's private Library directory, and resolves stored paths back to
 * URIs the WebView and native plugins can use.
 */
@Injectable({ providedIn: 'root' })
export class DocumentStorageService {
  private baseUri = '';

  /** Resolves the Library directory URI once so `toUri()` can stay synchronous. */
  async init(): Promise<void> {
    if (!Capacitor.isNativePlatform() || this.baseUri) {
      return;
    }
    const { uri } = await Filesystem.getUri({ directory: LIBRARY_DIRECTORY, path: '' });
    this.baseUri = uri.endsWith('/') ? uri : `${uri}/`;
  }

  /** Copies a fresh scan into `scans/<id>/` and returns the relative paths. */
  async persist(id: string, scan: ScanResult): Promise<StoredFiles> {
    const folder = `${SCANS_FOLDER}/${id}`;
    await Filesystem.mkdir({ path: folder, directory: LIBRARY_DIRECTORY, recursive: true });

    const pages = await Promise.all(
      scan.images.map((from, index) => this.copy(from, `${folder}/page-${index + 1}.jpg`)),
    );
    const pdf = scan.pdf ? await this.copy(scan.pdf, `${folder}/document.pdf`) : null;

    return { pages, pdf };
  }

  async remove(id: string): Promise<void> {
    try {
      await Filesystem.rmdir({ path: `${SCANS_FOLDER}/${id}`, directory: LIBRARY_DIRECTORY, recursive: true });
    } catch {
      // Folder already gone — nothing to clean up.
    }
  }

  /** Absolute `file://` URI for native plugins (Share, File Opener). */
  toUri(relativePath: string): string {
    return `${this.baseUri}${relativePath}`;
  }

  /** WebView-safe URL for rendering an image with `ion-img`. */
  toWebSrc(relativePath: string): string {
    return Capacitor.convertFileSrc(this.toUri(relativePath));
  }

  private async copy(from: string, to: string): Promise<string> {
    await Filesystem.copy({ from, to, toDirectory: LIBRARY_DIRECTORY });
    return to;
  }
}
