import { Component, inject, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { AlertComponent } from './components/alert/alert.component';
import { ToastComponent } from './components/toast/toast.component';
import { ScanFeedbackService } from './services/scan-feedback/scan-feedback.service';
import { ScanWorkflowService } from './services/scan-workflow/scan-workflow.service';

/** Minimal root shell: router outlet, the app-wide declarative overlays, and scan recovery. */
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, AlertComponent, ToastComponent],
})
export class AppComponent implements OnInit {
  private readonly workflow = inject(ScanWorkflowService);
  private readonly feedback = inject(ScanFeedbackService);

  ngOnInit(): void {
    // Picks up a scan whose WebView was restarted by the OS while the native scanner was open.
    this.workflow
      .resumeInterruptedScan()
      .then((outcome) => outcome && this.feedback.showSaved(outcome))
      .catch((error) => this.feedback.showFailed(error));
  }
}
