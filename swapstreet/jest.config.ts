import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  setupFiles: ["<rootDir>/jest.setup.ts"],
  setupFilesAfterEnv: ["<rootDir>/jest-dom.setup.ts"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  collectCoverage: true,
  // 1. collectCoverageFrom: Which source files should be measured?
  collectCoverageFrom: [
    "app/**/*.{js,jsx,ts,tsx}",
    "!app/layout.{js,tsx}",
    "!app/seller/**",
    // "!app/browse/**", // Ignore all source files in browse
    "!app/wardrobe/**", // Ignore all source files in wardrobe
    // "!app/listing/[id]/**", // Ignore the specific dynamic route folder
    // "!app/profile/**", // Ignore the specific dynamic route folder
  ],
  coverageDirectory: "coverage",
  // 2. testPathIgnorePatterns: Which test files should NOT be executed?
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/.next/",
    "<rootDir>/e2e/",
    "<rootDir>/tests/__tests__/wardrobe/",
    "<rootDir>/tests/__tests__/seller/",
    // "<rootDir>/tests/__tests__/browse/", // Stops "Your test suite must contain at least one test"
    // "<rootDir>/tests/__tests__/wardrobe/",
    // "<rootDir>/tests/__tests__/profile/", // Stops "Cannot find module user-event"
  ],
  // 3. coveragePathIgnorePatterns: Extra safety to exclude paths from coverage reports
  coveragePathIgnorePatterns: [
    "/node_modules/",
    // "/app/browse/",
    // "/app/wardrobe/",
    // "/app/listing/\\[id\\]/", // Note: bracket escaping for regex
  ],
};

export default createJestConfig(customJestConfig);
