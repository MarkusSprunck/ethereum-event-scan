import {enableProdMode, importProvidersFrom} from '@angular/core';
import {bootstrapApplication} from '@angular/platform-browser';
import {config as zodConfig} from 'zod';

import {AppModule} from './app/app.module';
import {MainComponent} from './app/pages/main/main.component';
import {environment} from './environments/environment';

// zod (used by web3-validator) probes new Function(), which a strict CSP reports as a violation
zodConfig({jitless: true});

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(MainComponent, {
  providers: [importProvidersFrom(AppModule)]
}).catch(err => console.error(err));
