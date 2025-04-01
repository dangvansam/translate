import {AfterViewInit, Component, inject} from '@angular/core';
import {TranslocoService} from '@jsverse/transloco';
import {filter, tap} from 'rxjs/operators';
import {firstValueFrom} from 'rxjs';
import {NavigationEnd, Router} from '@angular/router';
// import {GoogleAnalyticsService} from './core/modules/google-analytics/google-analytics.service';
import {Capacitor} from '@capacitor/core';
import {languageCodeNormalizer} from './core/modules/transloco/languages';
import {Meta} from '@angular/platform-browser';
import {IonApp, IonRouterOutlet} from '@ionic/angular/standalone';
import {getUrlParams} from './core/helpers/url';
// import * as CookieConsent from 'vanilla-cookieconsent';
// import {ConsentStatus, ConsentType, FirebaseAnalytics} from '@capacitor-firebase/analytics';
import {MediaMatcher} from '@angular/cdk/layout';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements AfterViewInit {
  private meta = inject(Meta);
  // private ga = inject(GoogleAnalyticsService);
  private transloco = inject(TranslocoService);
  private router = inject(Router);
  private mediaMatcher = inject(MediaMatcher);

  urlParams = getUrlParams();

  constructor() {
    this.listenLanguageChange();
    this.logRouterNavigation();
    this.checkURLEmbedding();
    this.updateToolbarColor();
    this.setPageKeyboardClass();
  }

  async ngAfterViewInit() {
    if (Capacitor.isNativePlatform()) {
      this.meta.updateTag({
        name: 'viewport',
        content:
          'minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, initial-scale=1.0, viewport-fit=cover, width=device-width',
      });

      const {SplashScreen} = await import(
        /* webpackChunkName: "@capacitor/splash-screen" */ '@capacitor/splash-screen'
      );
      await SplashScreen.hide();
    }

    // this.initCookieConsent();
  }

  updateToolbarColor() {
    if (!('window' in globalThis)) {
      return;
    }

    const matcher = this.mediaMatcher.matchMedia('(prefers-color-scheme: dark)');

    function onColorSchemeChange(): any {
      const toolbar = document.querySelector('ion-toolbar');
      if (!toolbar) {
        // Try again if the toolbar is not yet available
        return requestAnimationFrame(onColorSchemeChange);
      }

      const toolbarColor = window.getComputedStyle(toolbar).getPropertyValue('--background');
      console.log('toolbarColor', toolbarColor);
      if (!toolbarColor) {
        // Try again if the color is not yet available
        return requestAnimationFrame(onColorSchemeChange);
      }

      // Update the theme-color meta tag with the toolbar color
      const mode = matcher.matches ? 'dark' : 'light';
      const selector = `meta[name="theme-color"][media="(prefers-color-scheme: ${mode})"]`;
      const themeColor = document.head.querySelector(selector);
      themeColor.setAttribute('content', toolbarColor);
    }

    matcher.addEventListener('change', onColorSchemeChange);
    onColorSchemeChange();
  }

  // initCookieConsent() {
  //   return CookieConsent.run({
  //     root: 'body',
  //     autoShow: true,
  //     hideFromBots: true,

  //     cookie: {
  //       name: 'cc_cookie',
  //       domain: window.location?.origin,
  //       path: '/',
  //       sameSite: 'Lax',
  //       expiresAfterDays: 182,
  //     },

  //     // https://cookieconsent.orestbida.com/reference/configuration-reference.html#guioptions
  //     guiOptions: {
  //       consentModal: {
  //         layout: 'cloud inline',
  //         position: 'bottom center',
  //         equalWeightButtons: true,
  //         flipButtons: false,
  //       },
  //       preferencesModal: {
  //         layout: 'box',
  //         equalWeightButtons: true,
  //         flipButtons: false,
  //       },
  //     },
  //     onConsent: ({cookie}) => {
  //       console.log('Consent given:', cookie);
  //       const categories: {[key: string]: ConsentType[]} = {
  //         functionality: [ConsentType.FunctionalityStorage, ConsentType.PersonalizationStorage],
  //         analytics: [ConsentType.AnalyticsStorage],
  //         marketing: [ConsentType.AdStorage, ConsentType.AdPersonalization, ConsentType.AdUserData],
  //       };
  //       for (const [category, types] of Object.entries(categories)) {
  //         const consent: ConsentStatus = cookie.categories.includes(category)
  //           ? ConsentStatus.Granted
  //           : ConsentStatus.Denied;
  //         for (const type of types) {
  //           FirebaseAnalytics.setConsent({type, status: consent});
  //         }
  //       }
  //     },
  //     categories: {
  //       necessary: {
  //         enabled: true, // this category is enabled by default
  //         readOnly: true, // this category cannot be disabled
  //       },
  //       functionality: {
  //         enabled: true,
  //       },
  //       analytics: {
  //         autoClear: {
  //           cookies: [
  //             {
  //               name: /^_ga/, // regex: match all cookies starting with '_ga'
  //             },
  //             {
  //               name: '_gid', // string: exact cookie name
  //             },
  //           ],
  //         },
  //         // https://cookieconsent.orestbida.com/reference/configuration-reference.html#category-services
  //         services: {
  //           ga: {
  //             label: 'Google Analytics',
  //           },
  //         },
  //       },
  //       marketing: {},
  //     },

  //     language: {
  //       default: 'vi',
  //       translations: {
  //         en: 'assets/i18n/vi.json',
  //       },
  //     },
  //   });
  // }

  logRouterNavigation() {
    const isLanguageLoaded = firstValueFrom(
      this.transloco.events$.pipe(filter(e => e.type === 'translationLoadSuccess'))
    );

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        tap(async (event: NavigationEnd) => {
          await isLanguageLoaded; // Before triggering page view, wait for language to be loaded
          // await this.ga.setCurrentScreen(event.urlAfterRedirects);
        })
      )
      .subscribe();
  }

  listenLanguageChange() {
    const urlParam = this.urlParams.get('lang'); // Get lang from URL if available
  
    if (!('navigator' in globalThis) || !('document' in globalThis)) {
      // If running in an SSR environment (without window/document), use the URL param
      this.transloco.setActiveLang(urlParam || 'vi'); // Default to 'vi'
      return;
    }
  
    this.transloco.langChanges$
      .pipe(
        tap(lang => {
          document.documentElement.lang = lang;
          document.dir = ['he', 'ar', 'fa', 'ku', 'ps', 'sd', 'ug', 'ur', 'yi'].includes(lang) ? 'rtl' : 'ltr';
  
          // Update OpenSearch meta tag
          const openSearch = Array.from(document.head.children).find(t => t.getAttribute('rel') === 'search');
          if (openSearch) {
            openSearch.setAttribute('href', `/opensearch.xml?lang=${lang}`);
          }
        })
      )
      .subscribe();
  
    // Set language based on URL param or default to 'vi'
    const browserLang = languageCodeNormalizer(navigator.language); // Normalize browser lang
    this.transloco.setActiveLang(urlParam || browserLang || 'vi'); 
  }
  
  checkURLEmbedding(): void {
    const urlParam = this.urlParams.get('embed');
    if (urlParam !== null) {
      document.body.classList.add('embed');
    }
  }

  async setPageKeyboardClass() {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    const {Keyboard} = await import(/* webpackChunkName: "@capacitor/keyboard" */ '@capacitor/keyboard');
    const html = document.documentElement;
    const className = 'keyboard-is-open';
    Keyboard.addListener('keyboardWillShow', () => html.classList.add(className));
    Keyboard.addListener('keyboardWillHide', () => html.classList.remove(className));
  }
}
