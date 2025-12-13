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
  // transform node_modules for Angular, zone.js and rxjs packages
  transformIgnorePatterns: ['/node_modules/(?!(@angular|zone.js|rxjs)/)'],
  moduleFileExtensions: ['ts', 'js', 'mjs', 'html', 'json'],
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts', '!src/environments/**']
}
