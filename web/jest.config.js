export default {
  displayName: 'web',
  preset: '../jest.preset.cjs',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx|js|jsx|mjs)$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: '<rootDir>/tsconfig.json',
    },
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'mjs'],
  coverageDirectory: '<rootDir>/coverage',
  setupFiles: [],
};
