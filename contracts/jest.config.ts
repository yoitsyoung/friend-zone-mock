import type { Config } from 'jest';

// @ts-expect-error For debugging purposes
BigInt.prototype.toJSON = function () {
    return this.toString();
};

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};

export default config;
