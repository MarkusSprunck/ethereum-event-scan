module.exports = {
  // using ts-jest for TS & babel-jest for ESM .mjs/.js files from Angular
  setupFilesAfterEnv: ['<rootDir>/setup-jest.js'],
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  testEnvironment: 'jest-environment-jsdom',
  transform: {
    '^.+\\.mjs$': 'babel-jest',
    '^.+\\.js$': 'babel-jest',
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.spec.json',
      stringifyContentPathRegex: '\\.html$',
      diagnostics: false
    }]
  },
  // transform node_modules for Angular and rxjs packages
  transformIgnorePatterns: ['/node_modules/(?!(@angular|rxjs|json-stringify-pretty-compact)/)'],
  moduleFileExtensions: ['ts', 'js', 'mjs', 'html', 'json'],
  // Use V8 coverage provider to avoid babel-plugin-istanbul instrumentation issues
  coverageProvider: 'v8',
  coverageReporters: ['text', 'lcov'],
  // skip collecting coverage from spec files and environment and main entry
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.spec.ts', '!src/main.ts', '!src/environments/**', '!src/app/app.module.ts', '!setup-jest.js'],
  coveragePathIgnorePatterns: ['/node_modules/']
}
