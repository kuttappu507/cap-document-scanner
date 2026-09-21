import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  IonContent, IonGrid, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonListHeader, IonNote, IonRange, IonRow, IonCol,
  IonSelect, IonSelectOption, IonTitle, IonToggle, IonToolbar, RangeCustomEvent, SelectCustomEvent, ToggleCustomEvent,
} from '@ionic/angular';
import { ScannerMode } from '@capawesome-team/capacitor-document-scanner';
import { addIcons } from 'ionicons';
import { folderOutline, imagesOutline, logoAndroid, refreshOutline, sparklesOutline, trashOutline } from 'ionicons/icons';
import { ScanSettings } from '../../../interfaces/scan-settings.interface';
import { AlertService } from '../../../services/alert/alert.service';
import { DeviceExportService } from '../../../services/device-export/device-export.service';
import { DocumentLibraryService } from '../../../services/document-library/document-library.service';
import { ScanSettingsService } from '../../../services/scan-settings/scan-settings.service';
import { ToastService } from '../../../services/toast/toast.service';

interface ScannerModeOption {
  value: ScannerMode;
  label: string;
}

@Component({
  selector: 'app-settings',
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, IonList, IonListHeader, IonItem, IonLabel,
    IonNote, IonRange, IonToggle, IonSelect, IonSelectOption, IonIcon,
  ],
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  private readonly settingsService = inject(ScanSettingsService);
  private readonly alert = inject(AlertService);
  private readonly toast = inject(ToastService);
  protected readonly library = inject(DocumentLibraryService);
  protected readonly filesLocation = inject(DeviceExportService).filesLocation;

  protected readonly settings = this.settingsService.settings;
  protected readonly scannerModes: ScannerModeOption[] = [
    { value: ScannerMode.Base, label: 'Basic (crop, rotate)' },
    { value: ScannerMode.BaseWithFilter, label: 'Filters (+ enhance)' },
    { value: ScannerMode.Full, label: 'Full (+ auto clean-up)' },
  ];

  constructor() {
    addIcons({ logoAndroid, imagesOutline, sparklesOutline, refreshOutline, trashOutline, folderOutline });
  }

  onRangeChange(key: 'pageLimit' | 'imageQuality', event: RangeCustomEvent): void {
    this.update({ [key]: Number(event.detail.value) });
  }

  onToggleChange(key: 'generatePdf' | 'androidGalleryImportAllowed' | 'saveToFiles' | 'saveToPhotos', event: ToggleCustomEvent): void {
    this.update({ [key]: event.detail.checked });
  }

  onModeChange(event: SelectCustomEvent<ScannerMode>): void {
    this.update({ androidScannerMode: event.detail.value });
  }

  async resetSettings(): Promise<void> {
    await this.settingsService.reset();
    this.toast.show('Scanner settings reset');
  }

  async deleteAll(): Promise<void> {
    const confirmed = await this.alert.confirm('Every scanned page and PDF will be permanently removed from this device.', {
      header: 'Delete all documents?',
      confirmText: 'Delete all',
      destructive: true,
    });
    if (confirmed) {
      await this.library.removeAll();
      this.toast.show('All documents deleted');
    }
  }

  private update(patch: Partial<ScanSettings>): void {
    void this.settingsService.update(patch);
  }
}
