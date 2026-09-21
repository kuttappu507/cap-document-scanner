import { ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import { PreloadAllModules, provideRouter, RouteReuseStrategy, withComponentInputBinding, withPreloading } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';
import { routes } from './app.routes';
import { DocumentLibraryService } from './services/document-library/document-library.service';
import { ScanSettingsService } from './services/scan-settings/scan-settings.service';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    // No global `mode` — iOS gets iOS styling, Android gets Material.
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules), withComponentInputBinding()),
    // Load saved documents and scanner defaults before the first screen renders.
    provideAppInitializer(() => Promise.all([inject(DocumentLibraryService).load(), inject(ScanSettingsService).load()])),
  ],
};
