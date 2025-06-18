import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {providePrimeNG} from 'primeng/config';
import {provideRouter} from '@angular/router';
import Aura from '@primeng/themes/aura';
import {routes} from './app.routes';
import {provideHttpClient} from '@angular/common/http';
import {Configuration} from '../openapi-client';

export const API_PATH = '/api/v1';
const config = new Configuration({
  basePath: API_PATH,
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    provideHttpClient(),

    {provide: Configuration, useValue: config},

    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura
      }
    })
  ]
};
