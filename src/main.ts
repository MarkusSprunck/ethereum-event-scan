import {enableProdMode, importProvidersFrom} from '@angular/core';
import {bootstrapApplication} from '@angular/platform-browser';

import {AppModule} from './app/app.module';
import {MainComponent} from './app/pages/main/main.component';
import {environment} from './environments/environment';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(MainComponent, {
  providers: [importProvidersFrom(AppModule)]
}).catch(err => console.error(err));
