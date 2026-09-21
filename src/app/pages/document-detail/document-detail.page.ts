import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import {
  IonBackButton, IonBadge, IonButton, IonButtons, IonCard, IonCardHeader, IonCardSubtitle, IonCol, IonContent,
  IonFooter, IonGrid, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonListHeader, IonRow, IonSpinner,
  IonText, IonTitle, IonToolbar, NavController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  checkmarkCircle, createOutline, documentOutline, documentTextOutline, folderOutline, imagesOutline, shareOutline, trashOutline,
} from 'ionicons/icons';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { ScannedDocument } from '../../interfaces/scanned-document.interface';
import { FileSrcPipe } from '../../pipes/file-src.pipe';
import { AlertService } from '../../services/alert/alert.service';
import { DocumentActionsService } from '../../services/document-actions/document-actions.service';
import { DeviceExportService } from '../../services/device-export/device-export.service';
import { DocumentLibraryService } from '../../services/document-library/document-library.service';
import { describeError, ScanWorkflowService } from '../../services/scan-workflow/scan-workflow.service';
import { ToastService } from '../../services/toast/toast.service';

@Component({
  selector: 'app-document-detail',
  imports: [
    DatePipe, FileSrcPipe, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonButton, IonIcon, IonContent,
    IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardSubtitle, IonText, IonBadge, IonFooter, IonList, IonListHeader, IonItem, IonLabel, IonSpinner,
    EmptyStateComponent,
  ],
  templateUrl: './document-detail.page.html',
  styleUrls: ['./document-detail.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentDetailPage {
  private readonly library = inject(DocumentLibraryService);
  private readonly actions = inject(DocumentActionsService);
  private readonly alert = inject(AlertService);
  private readonly toast = inject(ToastService);
  private readonly nav = inject(NavController);
  private readonly workflow = inject(ScanWorkflowService);
  protected readonly filesLocation = inject(DeviceExportService).filesLocation;

  /** Which export is currently running, to show a spinner on that row. */
  protected readonly exporting = signal<'files' | 'photos' | null>(null);

  /** Route param `:id`, bound via withComponentInputBinding(). */
  readonly id = input.required<string>();

  protected readonly document = computed(() => this.library.documents().find((doc) => doc.id === this.id()));

  constructor() {
    addIcons({ createOutline, shareOutline, documentTextOutline, documentOutline, trashOutline, folderOutline, imagesOutline, checkmarkCircle });
  }

  async rename(document: ScannedDocument): Promise<void> {
    const title = await this.alert.prompt({ header: 'Rename document', value: document.title, placeholder: 'Document name' });
    if (title !== null) {
      await this.library.rename(document.id, title);
    }
  }

  async share(document: ScannedDocument): Promise<void> {
    await this.run(() => this.actions.share(document), 'Could not open the share sheet.');
  }

  async openPdf(document: ScannedDocument): Promise<void> {
    await this.run(() => this.actions.openPdf(document), 'No app found to open PDF files.');
  }

  async openPage(path: string): Promise<void> {
    await this.run(() => this.actions.openPage(path), 'No app found to open images.');
  }

  async saveToFiles(document: ScannedDocument): Promise<void> {
    await this.export('files', () => this.workflow.saveToFiles(document), `Saved to ${this.filesLocation}`);
  }

  async saveToPhotos(document: ScannedDocument): Promise<void> {
    await this.export('photos', () => this.workflow.saveToPhotos(document), 'Saved to Photos');
  }

  async remove(document: ScannedDocument): Promise<void> {
    const confirmed = await this.alert.confirm(`"${document.title}" and all its pages will be deleted.`, {
      header: 'Delete document?',
      confirmText: 'Delete',
      destructive: true,
    });
    if (confirmed) {
      await this.nav.navigateBack('/tabs/library');
      await this.library.remove(document.id);
      this.toast.show('Document deleted');
    }
  }

  private async export(target: 'files' | 'photos', action: () => Promise<unknown>, success: string): Promise<void> {
    this.exporting.set(target);
    try {
      await action();
      this.toast.success(success);
    } catch (error) {
      await this.alert.notify(describeError(error), target === 'files' ? 'Could not save to Files' : 'Could not save to Photos');
    } finally {
      this.exporting.set(null);
    }
  }

  private async run(action: () => Promise<void>, failureMessage: string): Promise<void> {
    try {
      await action();
    } catch {
      this.toast.error(failureMessage);
    }
  }
}
