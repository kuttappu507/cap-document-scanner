import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IonBadge, IonItem, IonLabel, IonThumbnail } from '@ionic/angular';
import { ScannedDocument } from '../../interfaces/scanned-document.interface';
import { FileSrcPipe } from '../../pipes/file-src.pipe';

/** One row in a document list: first-page thumbnail, title, date and page count. */
@Component({
  selector: 'app-document-item',
  imports: [DatePipe, FileSrcPipe, IonItem, IonThumbnail, IonLabel, IonBadge],
  templateUrl: './document-item.component.html',
  styleUrls: ['./document-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentItemComponent {
  readonly document = input.required<ScannedDocument>();
  readonly selected = output<ScannedDocument>();
}
