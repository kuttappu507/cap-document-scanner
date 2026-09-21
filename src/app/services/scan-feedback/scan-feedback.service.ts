import { inject, Injectable } from '@angular/core';
import { NavController } from '@ionic/angular';
import { AlertService } from '../alert/alert.service';
import { DeviceExportService } from '../device-export/device-export.service';
import { describeError, ScanOutcome } from '../scan-workflow/scan-workflow.service';
import { ToastService } from '../toast/toast.service';

/** Tells the user how a scan ended: opens the document and shows a toast or alert. */
@Injectable({ providedIn: 'root' })
export class ScanFeedbackService {
  private readonly nav = inject(NavController);
  private readonly toast = inject(ToastService);
  private readonly alert = inject(AlertService);
  private readonly exporter = inject(DeviceExportService);

  async showSaved({ document, warnings }: ScanOutcome): Promise<void> {
    await this.nav.navigateForward(['/document', document.id]);
    if (warnings.length) {
      await this.alert.notify(`The scan is in your library, but some copies failed.\n${warnings.join('\n')}`, 'Partly saved');
      return;
    }
    const pages = `${document.pages.length} ${document.pages.length === 1 ? 'page' : 'pages'}`;
    this.toast.success(document.savedToFiles ? `Saved ${pages} to ${this.exporter.filesLocation}` : `Saved ${pages}`);
  }

  async showFailed(error: unknown): Promise<void> {
    console.error('[DocScan] scan failed', describeError(error), error);
    await this.alert.notify(describeError(error), 'Scan not saved');
  }
}
