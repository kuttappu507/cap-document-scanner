import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IonIcon, IonText } from '@ionic/angular';

/** Centered icon + message used whenever a list has nothing to show. Actions are projected. */
@Component({
  selector: 'app-empty-state',
  imports: [IonIcon, IonText],
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly icon = input.required<string>();
  readonly heading = input.required<string>();
  readonly message = input<string>('');
}
