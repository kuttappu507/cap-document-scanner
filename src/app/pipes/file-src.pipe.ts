import { inject, Pipe, PipeTransform } from '@angular/core';
import { DocumentStorageService } from '../services/document-storage/document-storage.service';

/** Turns a stored relative file path into a URL the WebView can render. */
@Pipe({ name: 'fileSrc' })
export class FileSrcPipe implements PipeTransform {
  private readonly storage = inject(DocumentStorageService);

  transform(relativePath: string): string {
    return this.storage.toWebSrc(relativePath);
  }
}
