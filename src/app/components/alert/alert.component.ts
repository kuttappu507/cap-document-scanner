import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IonAlert } from '@ionic/angular';
import { AlertService } from '../../services/alert/alert.service';

@Component({
  selector: 'app-alert',
  imports: [IonAlert],
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertComponent {
  protected readonly alert = inject(AlertService);
}
