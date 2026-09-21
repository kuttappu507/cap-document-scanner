import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IonBadge, IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { documentsOutline, scanOutline, settingsOutline } from 'ionicons/icons';
import { DocumentLibraryService } from '../../services/document-library/document-library.service';

@Component({
  selector: 'app-tabs',
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonBadge],
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsPage {
  protected readonly library = inject(DocumentLibraryService);

  constructor() {
    addIcons({ scanOutline, documentsOutline, settingsOutline });
  }
}
