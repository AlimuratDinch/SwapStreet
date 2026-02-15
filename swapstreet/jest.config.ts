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
    "!app/layout.{js,tsx}",
    "!**/node_modules/**",
    "!**/.next/**",
    "!app/browse/**", 
  ],
  coverageDirectory: "coverage",
  testPathIgnorePatterns: [
    "<rootDir>/e2e/",
    "<rootDir>/app/browse/" 
  ],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/app/browse/", // NEEDS TO BE REFACTORED, no point writting tests that will be replaced
    "app/wardrobe/",
    "app/listing/[id]/page.tsx",
  ],
};