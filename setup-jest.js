// CommonJS setup to avoid ts-jest transforming this file (works around transformer issue)
const { polyfillEncoder } = require('jest-preset-angular/setup-env/utils');
polyfillEncoder();

// Ensure Zone global is defined
require('zone.js');
// Load zone testing via package export
require('zone.js/testing');

const { getTestBed } = require('@angular/core/testing');
const { BrowserDynamicTestingModule, platformBrowserDynamicTesting } = require('@angular/platform-browser-dynamic/testing');

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);

