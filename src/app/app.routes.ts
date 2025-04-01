import { Routes, ResolveFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { provideStates } from '@ngxs/store';
import { TranslateState } from './modules/translate/translate.state';
import { LanguageDetectionService } from './modules/translate/language-detection/language-detection.service';
import { MediaPipeLanguageDetectionService } from './modules/translate/language-detection/mediapipe.service';
import { MainComponent } from './pages/main.component';

// ✅ Define an inline resolver function to handle the redirection
const langRedirectResolver: ResolveFn<void> = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // ✅ Ensure the code only runs in the browser (not on the server)
  if (isPlatformBrowser(platformId)) {
    const urlParams = new URLSearchParams(window.location.search);
    const lang = urlParams.get('lang');

    if (!lang) {
      router.navigateByUrl('/?lang=vi'); // Redirect to default language
    }
  }

  return;
};

// Define your routes
export const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    // resolve: { lang: langRedirectResolver }, // Attach resolver to handle language redirection
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/translate/translate.component').then(m => m.TranslateComponent),
        providers: [
          provideStates([TranslateState]),
          { provide: LanguageDetectionService, useClass: MediaPipeLanguageDetectionService },
        ],
      },
      {
        path: 'translate',
        redirectTo: '',
      },
      { path: 'settings', loadChildren: () => import('./pages/settings/settings.routes').then(m => m.routes) },
    ],
  },
  { path: '**', redirectTo: ''},
];
