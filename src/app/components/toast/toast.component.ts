import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IonToast } from '@ionic/angular';
import { ToastService } from '../../services/toast/toast.service';

@Component({
  selector: 'app-toast',
  imports: [IonToast],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  protected readonly toast = inject(ToastService);
}
