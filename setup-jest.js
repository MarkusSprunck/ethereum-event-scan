// CommonJS setup to avoid ts-jest transforming this file (works around transformer issue)
const { polyfillEncoder } = require('jest-preset-angular/setup-env/utils');
polyfillEncoder();

// Try to load Zone.js (optional) -- wrapping in try/catch lets CI/tests run even if zone.js is removed
try {
  // Ensure Zone global is defined
  require('zone.js');
  // Then load Zone.js testing helpers
  require('zone.js/testing');
} catch (e) {
  // zone.js not installed; proceed without it (Angular v21 supports zone-less operation in many cases)
}

const { getTestBed } = require('@angular/core/testing');
const { BrowserDynamicTestingModule, platformBrowserDynamicTesting } = require('@angular/platform-browser-dynamic/testing');

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);

// --- Test harness improvements for cleaner CI output ---
// Mock location.reload so tests that call it don't trigger jsdom navigation errors
try {
  if (typeof window !== 'undefined' && window && window.location) {
    try { window.location.reload = () => {}; } catch (e) {
      const loc = window.location;
      Object.defineProperty(window, 'location', { configurable: true, enumerable: true, writable: true, value: loc });
      window.location.reload = () => {};
    }
  }
} catch (e) { /* ignore */ }

// Silence debug logs from library internals that are noisy during tests
console.debug = (..._args) => { /* noop for CI */ };

// Preserve originals
const _origWarn = console.warn.bind(console);
const _origError = console.error.bind(console);

// Filter known, non-actionable messages so CI output stays clean
console.warn = (...args) => {
  try {
    const str = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
    // ignore noisy, non-actionable warnings frequently emitted by web3/tests
    if (str.includes('Web3 provider not initialized') || str.includes('base64->bin failed') || str.includes('Web3 not available for getCachedTimestamp') || str.includes('Max attempts reached') || str.includes('No reader/web3 available')) {
      return;
    }
  } catch (e) {
    // ignore
  }
  _origWarn(...args);
};

console.error = (...args) => {
  try {
    const str = args.map(a => (typeof a === 'string' ? a : (a && a.message) || JSON.stringify(a))).join(' ');
    // ignore recurring, expected errors from test stubs or external services
    if (str.includes('Not implemented: navigation') || str.includes('Failed to decode base64 and not hex') || str.includes('query returned more than 10000') || str.includes('No reader/web3 available for renderBlock')) {
      return;
    }
  } catch (e) {
    // ignore
  }
  _origError(...args);
};
