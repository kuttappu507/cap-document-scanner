import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonItemOption, IonItemOptions, IonItemSliding, IonList, IonRow, IonSearchbar, IonTitle,
  IonToolbar, NavController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { documentsOutline, searchOutline, trashOutline } from 'ionicons/icons';
import { DocumentItemComponent } from '../../../components/document-item/document-item.component';
import { EmptyStateComponent } from '../../../components/empty-state/empty-state.component';
import { ScannedDocument } from '../../../interfaces/scanned-document.interface';
import { AlertService } from '../../../services/alert/alert.service';
import { DocumentLibraryService } from '../../../services/document-library/document-library.service';
import { ToastService } from '../../../services/toast/toast.service';

@Component({
  selector: 'app-library',
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, IonSearchbar, IonList, IonItemSliding, IonItemOptions, IonItemOption,
    IonIcon, DocumentItemComponent, EmptyStateComponent,
  ],
  templateUrl: './library.page.html',
  styleUrls: ['./library.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryPage {
  private readonly library = inject(DocumentLibraryService);
  private readonly alert = inject(AlertService);
  private readonly toast = inject(ToastService);
  private readonly nav = inject(NavController);

  protected readonly query = signal('');
  protected readonly hasDocuments = computed(() => this.library.count() > 0);
  protected readonly filtered = computed(() => {
    const term = this.query().trim().toLowerCase();
    const documents = this.library.documents();
    return term ? documents.filter((doc) => doc.title.toLowerCase().includes(term)) : documents;
  });

  constructor() {
    addIcons({ documentsOutline, searchOutline, trashOutline });
  }

  openDocument(document: ScannedDocument): void {
    this.nav.navigateForward(['/document', document.id]);
  }

  async remove(document: ScannedDocument, sliding: IonItemSliding): Promise<void> {
    await sliding.close();
    const confirmed = await this.alert.confirm(`"${document.title}" and all its pages will be deleted.`, {
      header: 'Delete document?',
      confirmText: 'Delete',
      destructive: true,
    });
    if (confirmed) {
      await this.library.remove(document.id);
      this.toast.show('Document deleted');
    }
  }
}
