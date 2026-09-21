import { inject, Injectable } from '@angular/core';
import { Share } from '@capacitor/share';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';
import { ScannedDocument } from '../../interfaces/scanned-document.interface';
import { DocumentStorageService } from '../document-storage/document-storage.service';

/** Hands saved files to the OS: share sheet and "open in another app". */
@Injectable({ providedIn: 'root' })
export class DocumentActionsService {
  private readonly storage = inject(DocumentStorageService);

  /** Shares the PDF when there is one, otherwise every page image. */
  async share(document: ScannedDocument): Promise<void> {
    const files = document.pdf ? [document.pdf] : document.pages;
    try {
      await Share.share({ title: document.title, files: files.map((path) => this.storage.toUri(path)) });
    } catch (error) {
      // Dismissing the share sheet rejects on some platforms — that's not an error.
      if (!this.isShareCanceled(error)) {
        throw error;
      }
    }
  }

  async openPdf(document: ScannedDocument): Promise<void> {
    if (document.pdf) {
      await FileOpener.openFile({ path: this.storage.toUri(document.pdf), mimeType: 'application/pdf' });
    }
  }

  async openPage(path: string): Promise<void> {
    await FileOpener.openFile({ path: this.storage.toUri(path), mimeType: 'image/jpeg' });
  }

  private isShareCanceled(error: unknown): boolean {
    return /cancel/i.test((error as { message?: string } | null)?.message ?? '');
  }
}
