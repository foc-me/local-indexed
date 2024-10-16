/** @type {import("ts-jest").JestConfigWithTsJest} */

module.exports = {
    preset: "ts-jest",
    testEnvironment: "./jest-environment-jsdom.js",
    moduleNameMapper: {
        "^lib/(.*)$": "<rootDir>/lib/$1",
        "^lib/": "<rootDir>/lib",
        "^src/(.*)$": "<rootDir>/src/$1",
        "^src/": "<rootDir>/src"
    }
}