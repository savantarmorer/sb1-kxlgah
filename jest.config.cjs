module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testMatch: [
    '<rootDir>/src/contexts/__tests__/*.test.ts',
    '<rootDir>/src/contexts/__tests__/*.test.tsx'
  ],
  transform: {
    '^.+\\.(ts|tsx|js|jsx|mjs|cjs)$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
      useESM: true
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/src/contexts/game/**/*.ts',
    '<rootDir>/src/contexts/GameContext.tsx'
  ],
  coverageReporters: ['text', 'lcov', 'json', 'clover'],
  coverageDirectory: '<rootDir>/coverage',
  globals: {
    'ts-jest': {
      isolatedModules: true,
      useESM: true
    }
  },
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  }
};
