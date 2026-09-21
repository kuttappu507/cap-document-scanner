import { inject, Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Media } from '@capacitor-community/media';
import { ScannedDocument } from '../../interfaces/scanned-document.interface';
import { DocumentStorageService, LIBRARY_DIRECTORY } from '../document-storage/document-storage.service';

const IS_IOS = Capacitor.getPlatform() === 'ios';

/**
 * Folder inside the public Documents directory.
 * iOS already shows the app's Documents as "On My iPhone › DocScan", so use a sub-folder
 * named "Scans" there instead of repeating "DocScan". Android: Documents › DocScan.
 */
const EXPORT_FOLDER = IS_IOS ? 'Scans' : 'DocScan';

/** Gallery album name (Android). */
const ALBUM_NAME = 'DocScan';

/**
 * Copies scans out of the app's private storage to places the user can reach
 * outside the app:
 * - Files: iOS → Files app › On My iPhone › DocScan › Scans · Android → Internal storage › Documents › DocScan
 * - Photos: iOS → Photos (Recents) · Android → Gallery › DocScan album
 */
@Injectable({ providedIn: 'root' })
export class DeviceExportService {
  private readonly storage = inject(DocumentStorageService);

  /** Human-readable location of the Files export, for the UI. */
  readonly filesLocation = IS_IOS ? 'Files › DocScan › Scans' : 'Documents › DocScan';

  /**
   * Saves the PDF (or the page images when no PDF was generated) to the public
   * Documents directory. Returns the saved path relative to Documents.
   */
  async saveToFiles(document: ScannedDocument): Promise<string> {
    await this.ensureFolder(EXPORT_FOLDER);
    const name = await this.uniqueName(this.fileName(document), document.pdf ? '.pdf' : '');

    if (document.pdf) {
      const target = `${EXPORT_FOLDER}/${name}.pdf`;
      await this.copyToDocuments(document.pdf, target);
      return target;
    }

    const folder = `${EXPORT_FOLDER}/${name}`;
    await this.ensureFolder(folder);
    for (const [index, page] of document.pages.entries()) {
      await this.copyToDocuments(page, `${folder}/page-${index + 1}.jpg`);
    }
    return folder;
  }

  /** Saves every page image to the photo gallery. */
  async saveToPhotos(document: ScannedDocument): Promise<void> {
    // iOS: no album → only "add photos" permission is requested. Android: an album is required.
    const albumIdentifier = Capacitor.getPlatform() === 'android' ? await this.androidAlbumId() : undefined;
    const baseName = this.fileName(document);

    for (const [index, page] of document.pages.entries()) {
      await Media.savePhoto({
        path: this.storage.toUri(page),
        albumIdentifier,
        fileName: `${baseName}-page-${index + 1}`,
      });
    }
  }

  private async copyToDocuments(from: string, to: string): Promise<void> {
    await Filesystem.copy({ from, directory: LIBRARY_DIRECTORY, to, toDirectory: Directory.Documents });
  }

  private async ensureFolder(path: string): Promise<void> {
    try {
      await Filesystem.mkdir({ path, directory: Directory.Documents, recursive: true });
    } catch {
      // Already exists.
    }
  }

  /** Appends " 2", " 3"… when a file or folder with the same name already exists. */
  private async uniqueName(base: string, extension: string): Promise<string> {
    for (let attempt = 1; attempt < 100; attempt++) {
      const candidate = attempt === 1 ? base : `${base} ${attempt}`;
      try {
        await Filesystem.stat({ path: `${EXPORT_FOLDER}/${candidate}${extension}`, directory: Directory.Documents });
      } catch {
        return candidate; // Doesn't exist yet.
      }
    }
    return `${base} ${Date.now()}`;
  }

  /** File-system-safe version of the document title. */
  private fileName(document: ScannedDocument): string {
    const cleaned = document.title
      .replace(/:/g, '.')
      .replace(/[\\/:*?"<>|,]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned || `Scan ${document.createdAt}`;
  }

  private async androidAlbumId(): Promise<string> {
    const find = async () => (await Media.getAlbums()).albums.find((album) => album.name === ALBUM_NAME)?.identifier;
    const existing = await find();
    if (existing) {
      return existing;
    }
    await Media.createAlbum({ name: ALBUM_NAME });
    const created = await find();
    if (!created) {
      throw new Error('Could not create the DocScan album in the gallery.');
    }
    return created;
  }
}
