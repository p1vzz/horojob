module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/src/**/*.rntl.test.ts', '<rootDir>/src/**/*.rntl.test.tsx'],
  setupFilesAfterEnv: ['<rootDir>/jest.rntl.setup.ts'],
};
