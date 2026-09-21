import { computed, inject, Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { StorageKeys } from '../../enums/storage-keys.enum';
import { ScanResult } from '../../interfaces/scan-result.interface';
import { ScannedDocument } from '../../interfaces/scanned-document.interface';
import { DocumentStorageService } from '../document-storage/document-storage.service';

/**
 * Owns the list of saved documents (state + metadata persistence).
 * File handling is delegated to DocumentStorageService.
 */
@Injectable({ providedIn: 'root' })
export class DocumentLibraryService {
  private readonly storage = inject(DocumentStorageService);
  private readonly _documents = signal<ScannedDocument[]>([]);
  private loaded = false;

  /** Newest first. */
  readonly documents = this._documents.asReadonly();
  readonly count = computed(() => this._documents().length);
  readonly totalPages = computed(() => this._documents().reduce((sum, doc) => sum + doc.pages.length, 0));
  readonly recent = computed(() => this._documents().slice(0, 3));

  async load(): Promise<void> {
    if (this.loaded) {
      return;
    }
    await this.storage.init();
    const { value } = await Preferences.get({ key: StorageKeys.Documents });
    this._documents.set(value ? (JSON.parse(value) as ScannedDocument[]) : []);
    this.loaded = true;
  }

  findById(id: string): ScannedDocument | undefined {
    return this._documents().find((doc) => doc.id === id);
  }

  /** Persists the files of a fresh scan and adds it to the top of the library. */
  async add(scan: ScanResult): Promise<ScannedDocument> {
    const id = this.createId();
    const createdAt = Date.now();
    const files = await this.storage.persist(id, scan);
    const document: ScannedDocument = { id, createdAt, title: this.defaultTitle(createdAt), ...files };

    await this.save([document, ...this._documents()]);
    return document;
  }

  async rename(id: string, title: string): Promise<void> {
    const trimmed = title.trim();
    if (trimmed) {
      await this.update(id, { title: trimmed });
    }
  }

  async update(id: string, patch: Partial<Omit<ScannedDocument, 'id'>>): Promise<ScannedDocument | undefined> {
    await this.save(this._documents().map((doc) => (doc.id === id ? { ...doc, ...patch } : doc)));
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.storage.remove(id);
    await this.save(this._documents().filter((doc) => doc.id !== id));
  }

  async removeAll(): Promise<void> {
    await Promise.all(this._documents().map((doc) => this.storage.remove(doc.id)));
    await this.save([]);
  }

  private async save(documents: ScannedDocument[]): Promise<void> {
    this._documents.set(documents);
    await Preferences.set({ key: StorageKeys.Documents, value: JSON.stringify(documents) });
  }

  /**
   * `crypto.randomUUID()` only exists in secure contexts, and iOS serves the app from
   * `capacitor://localhost`, where it may be missing — so build the id ourselves.
   */
  private createId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private defaultTitle(timestamp: number): string {
    const date = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp);
    return `Scan ${date}`;
  }
}
