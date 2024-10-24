import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    setupFiles: ['<rootDir>/jest.setup.ts'],
    testEnvironment: 'node',
    testMatch: ['<rootDir>/tests/*.test.ts'],
};

export default config;
