const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  collectCoverage: true,
  collectCoverageFrom: [
    "app/**/*.{js,jsx,ts,tsx}",
    "!app/layout.tsx",
    "!app/layout.js",
    "!**/node_modules/**",
    "!**/.next/**",
  ],
  coverageDirectory: "coverage",
};

module.exports = createJestConfig(customJestConfig);
