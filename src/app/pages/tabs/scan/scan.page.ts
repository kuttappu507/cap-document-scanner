import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import {
  IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonChip, IonCol, IonContent,
  IonGrid, IonHeader, IonIcon, IonLabel, IonList, IonListHeader, IonRow, IonSpinner, IonTitle, IonToolbar,
  NavController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cameraOutline, checkmarkCircle, documentTextOutline, informationCircleOutline, scanOutline } from 'ionicons/icons';
import { DocumentItemComponent } from '../../../components/document-item/document-item.component';
import { EmptyStateComponent } from '../../../components/empty-state/empty-state.component';
import { ScannedDocument } from '../../../interfaces/scanned-document.interface';
import { DocumentLibraryService } from '../../../services/document-library/document-library.service';
import { DocumentScannerService } from '../../../services/document-scanner/document-scanner.service';
import { ScanFeedbackService } from '../../../services/scan-feedback/scan-feedback.service';
import { ScanWorkflowService } from '../../../services/scan-workflow/scan-workflow.service';
import { ScanSettingsService } from '../../../services/scan-settings/scan-settings.service';

@Component({
  selector: 'app-scan',
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle,
    IonCardSubtitle, IonCardContent, IonButton, IonIcon, IonChip, IonLabel, IonList, IonListHeader, IonSpinner,
    DocumentItemComponent, EmptyStateComponent,
  ],
  templateUrl: './scan.page.html',
  styleUrls: ['./scan.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScanPage implements OnInit {
  private readonly scanner = inject(DocumentScannerService);
  private readonly workflow = inject(ScanWorkflowService);
  private readonly feedback = inject(ScanFeedbackService);
  private readonly settingsService = inject(ScanSettingsService);
  private readonly nav = inject(NavController);
  protected readonly library = inject(DocumentLibraryService);

  protected readonly available = this.scanner.available;
  protected readonly scanning = computed(() => this.workflow.status() !== 'idle');
  protected readonly saving = computed(() => this.workflow.status() === 'saving');

  /** Short, human-readable summary of the options the next scan will use. */
  protected readonly settingsSummary = computed(() => {
    const { pageLimit, imageQuality, generatePdf, saveToFiles, saveToPhotos } = this.settingsService.settings();
    return [
      `Up to ${pageLimit} pages`,
      `${imageQuality}% quality`,
      generatePdf ? 'PDF included' : 'Images only',
      ...(saveToFiles ? ['Saves to Files'] : []),
      ...(saveToPhotos ? ['Saves to Photos'] : []),
    ];
  });

  constructor() {
    addIcons({ scanOutline, cameraOutline, checkmarkCircle, informationCircleOutline, documentTextOutline });
  }

  ngOnInit(): void {
    void this.scanner.checkAvailability();
  }

  async startScan(): Promise<void> {
    try {
      const outcome = await this.workflow.scanAndSave();
      if (outcome) {
        await this.feedback.showSaved(outcome);
      }
    } catch (error) {
      await this.feedback.showFailed(error);
    }
  }

  openDocument(document: ScannedDocument): void {
    this.nav.navigateForward(['/document', document.id]);
  }
}
