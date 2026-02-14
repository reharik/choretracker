export default {
  displayName: 'api',
  preset: '../jest.preset.cjs',
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
  },
  coverageDirectory: '<rootDir>/coverage',
  testMatch: ['**/tests/**/*.tests.ts', '**/?(*.)+(spec|test).?([mc])[jt]s?(x)'],
  transformIgnorePatterns: ['node_modules/(?!(smart-enums|case-anything|@chore-tracker)/)'],
};
