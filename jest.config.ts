import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/*.test.ts'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^errorHandler$': '<rootDir>/src/errorHandler',
        '^models/(.*)$': '<rootDir>/src/models/$1',
        '^routes/(.*)$': '<rootDir>/src/routes/$1',
        '^services/(.*)$': '<rootDir>/src/services/$1',
        '^utils$': '<rootDir>/src/utils',
    },
    setupFilesAfterEnv: ['<rootDir>/src/jest/jest.setup.ts'],
    globalSetup: '<rootDir>/src/jest/globalSetup.ts',
    globalTeardown: '<rootDir>/src/jest/globalTeardown.ts',
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coveragePathIgnorePatterns: ['/node_modules/', '/src/jest/'],
}

export default config
