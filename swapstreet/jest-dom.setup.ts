import "@testing-library/jest-dom";

// Silence console logs/errors globally
beforeAll(() => {
  if (!console.error.mock) {
    jest.spyOn(console, "error").mockImplementation(() => {});
  }
  if (!console.log.mock) {
    jest.spyOn(console, "log").mockImplementation(() => {});
  }
});
