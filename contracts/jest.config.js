export default {
  displayName: 'contracts',
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
  coverageDirectory: '<rootDir>/coverage',
  testMatch: ['**/tests/**/*.tests.ts', '**/?(*.)+(spec|test).?([mc])[jt]s?(x)'],
};
