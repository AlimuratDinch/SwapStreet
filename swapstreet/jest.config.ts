import nextJest from "next/jest";

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
  collectCoverageFrom: [
    "app/**/*.{js,jsx,ts,tsx}",
    "!app/layout.tsx",
    "!app/layout.js",
    "!**/node_modules/**",
    "!**/.next/**",
    "!app/browse/BrowseElements.tsx",
    "!app/browse/InfiniteBrowse.tsx",
  ],
  coverageDirectory: "coverage",
  testPathIgnorePatterns: ["<rootDir>/e2e/"],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/app/browse/BrowseElements.tsx", // NEEDS TO BE REFACTORED
    "/app/browse/InfiniteBrowse.tsx", // NEEDS TO BE REFACTORED
    "app/wardrobe/", // NEEDS TO BE REFACTORED
    "app/listing/[id]/page.tsx", // NEEDS TO BE REFACTORED
  ],
};

module.exports = createJestConfig(customJestConfig);
