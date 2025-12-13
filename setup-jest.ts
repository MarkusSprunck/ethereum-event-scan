const { polyfillEncoder } = require('jest-preset-angular/setup-env/utils');
polyfillEncoder();

// Ensure Zone global is defined by loading the base zone bundle
require('zone.js');
// Then load Zone.js testing helpers
require('zone.js/testing');

const { getTestBed } = require('@angular/core/testing');
const { BrowserDynamicTestingModule, platformBrowserDynamicTesting } = require('@angular/platform-browser-dynamic/testing');

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);
