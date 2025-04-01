import { HttpClient } from '@angular/common/http';
import { Translation, TRANSLOCO_SCOPE, TranslocoLoader } from '@jsverse/transloco';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class HttpLoader implements TranslocoLoader {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private document = inject(DOCUMENT); // Inject DOCUMENT instead of using window

  getTranslation(lang: string): Observable<Translation> {
    let path = `assets/i18n/${lang}.json`;

    if (!isPlatformBrowser(this.platformId)) {
      path = `${this.document.location?.origin}/${path}`; // Safe access to location
    }

    return this.http.get<Translation>(path).pipe(
      catchError(error => {
        console.error(`🔴 Failed to load translation file: ${path}`, error);
        return of({});
      })
    );
  }
}

export const translocoScopes = {
  provide: TRANSLOCO_SCOPE,
  useValue: ['', 'countries', 'languages', 'signedLanguagesShort'],
};
