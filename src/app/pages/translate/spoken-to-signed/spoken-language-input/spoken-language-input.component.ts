import { Component, inject, Input, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounce, distinctUntilChanged, skipWhile, takeUntil, tap, switchMap } from 'rxjs/operators';
import { interval, Observable, of } from 'rxjs';
import {
  SetSpokenLanguage,
  SetSpokenLanguageText,
  SuggestAlternativeText,
} from '../../../../modules/translate/translate.actions';
import { Store } from '@ngxs/store';
import { TranslateStateModel } from '../../../../modules/translate/translate.state';
import { BaseComponent } from '../../../../components/base/base.component';
import {
  IonButton,
  IonButtons,
  IonIcon,
  IonTextarea,
  IonToolbar,
  IonLabel,
  IonTabButton,
  IonTabBar,
  IonTabs,
  IonSegmentButton,
  IonSegment,
} from '@ionic/angular/standalone';
import { SpeechToTextComponent } from '../../../../components/speech-to-text/speech-to-text.component';
import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';
import { addIcons } from 'ionicons';
import { addOutline, sparkles } from 'ionicons/icons';
import { AsyncPipe, DecimalPipe, CommonModule } from '@angular/common';
import { TextToSpeechComponent } from '../../../../components/text-to-speech/text-to-speech.component';
import { DesktopTextareaComponent } from './desktop-textarea/desktop-textarea.component';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-spoken-language-input',
  templateUrl: './spoken-language-input.component.html',
  styleUrls: ['./spoken-language-input.component.scss'],
  imports: [
    CommonModule,
    IonToolbar,
    IonButtons,
    IonLabel,
    IonTabButton,
    IonTabBar,
    IonSegmentButton,
    IonSegment,
    IonTabs,
    IonButton,
    IonIcon,
    IonTextarea,
    DesktopTextareaComponent,
    SpeechToTextComponent,
    ReactiveFormsModule,
    TranslocoPipe,
    DecimalPipe,
    TextToSpeechComponent,
    AsyncPipe,
    TranslocoDirective,
  ],
})
export class SpokenLanguageInputComponent extends BaseComponent implements OnInit {
  private store = inject(Store);
  private http = inject(HttpClient); // Inject HttpClient for API calls

  translate$!: Observable<TranslateStateModel>;
  text$!: Observable<string>;
  normalizedText$!: Observable<string>;

  text = new FormControl();
  maxTextLength = 500;
  detectedLanguage!: string;
  spokenLanguage!: string;

  @Input() isMobile = false;
  mode: string = "text"; // Default mode

  private apiUrl = 'https://your-api.com/process-text'; // Replace with actual API URL

  constructor() {
    super();
    this.translate$ = this.store.select<TranslateStateModel>(state => state.translate);
    this.text$ = this.store.select<string>(state => state.translate.spokenLanguageText);
    this.normalizedText$ = this.store.select<string>(state => state.translate.normalizedSpokenLanguageText);

    addIcons({ sparkles, addOutline });
  }

  ngOnInit() {
    this.translate$
      .pipe(
        tap(({ spokenLanguage, detectedLanguage }) => {
          this.detectedLanguage = detectedLanguage;
          this.spokenLanguage = spokenLanguage ?? detectedLanguage;
        }),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe();

    // Process input text: store modified text but keep showing original text
    this.text.valueChanges
      .pipe(
        debounce(() => interval(300)),
        skipWhile(text => !text), // Ignore empty input
        distinctUntilChanged((a, b) => a.trim() === b.trim()),
        switchMap(text => this.modifyText(text)), // API call to modify text
        tap(modifiedText => {
          this.store.dispatch(new SetSpokenLanguageText(modifiedText)); // Store modified text
        }),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe();

    // Suggest alternative text after delay
    this.text.valueChanges
      .pipe(
        debounce(() => interval(1000)),
        distinctUntilChanged((a, b) => a.trim() === b.trim()),
        tap(() => this.store.dispatch(new SuggestAlternativeText())),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe();

    // Listen for store updates but **don't modify text field value**
    this.text$
      .pipe(
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe();
  }

  // API Call to Modify Text (Mocked Response for Debugging)
  private modifyText(text: string): Observable<string> {
    console.log('modifyText:', text);
    if (text === "xin chào"){
      text = "hello"
    } else if (text === "tạm biệt") {
      text = "bye"
    } else if (text === "tên bạn là gì") {
      text = "what is you name"
    } else if (text === "cảm ơn") {
      text = "thank you"
    }
    return of(text)

    // return this.http.post<string>(this.apiUrl, { text }).pipe(
    //   tap(response => console.log('API Response:', response)),
    //   // If API fails, return original text
    //   switchMap(response => of(response || text))
    // );
  }

  setText(text: string) {
    this.store.dispatch(new SetSpokenLanguageText(text));
  }

  toggleMode(event: any) {
    this.mode = event.detail.value;
  }

  setDetectedLanguage() {
    this.store.dispatch(new SetSpokenLanguage(this.detectedLanguage));
  }
}
