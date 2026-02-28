export default {
  displayName: 'api',
  preset: '../../infra/config/jest/jest.preset.cjs',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.(ts|tsx|js|mjs)$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'esnext',
          moduleResolution: 'node',
          target: 'ES2022',
        },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'mjs'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^./knexfile$': '<rootDir>/src/tests/__mocks__/knexfile.js',
  },
  coverageDirectory: '<rootDir>/coverage',
  setupFiles: ['<rootDir>/src/tests/setup.ts'],
  testMatch: ['**/tests/**/*.tests.ts', '**/?(*.)+(spec|test).?([mc])[jt]s?(x)'],
  transformIgnorePatterns: ['node_modules/(?!(smart-enums|case-anything|@network)/)'],
};
