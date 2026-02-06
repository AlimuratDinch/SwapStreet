process.env.NEXT_PUBLIC_API_URL = "http://backend:8080";

// Provide URL.createObjectURL / revokeObjectURL for tests
if (
  typeof globalThis.URL === "undefined" ||
  typeof globalThis.URL.createObjectURL === "undefined"
) {
  const urlObj = {
    createObjectURL: jest.fn(() => "blob:mock"),
    revokeObjectURL: jest.fn(),
  } as const;
  Object.defineProperty(globalThis, "URL", {
    configurable: true,
    writable: true,
    value: (globalThis as unknown as { URL?: unknown }).URL || urlObj,
  });
} else {
  // ensure functions exist
  if (
    typeof (globalThis as unknown as { URL: { createObjectURL?: unknown } }).URL
      .createObjectURL === "undefined"
  ) {
    Object.defineProperty(
      (globalThis as unknown as { URL: { createObjectURL?: unknown } }).URL,
      "createObjectURL",
      {
        configurable: true,
        writable: true,
        value: jest.fn(() => "blob:mock"),
      },
    );
  }
  if (
    typeof (globalThis as unknown as { URL: { revokeObjectURL?: unknown } }).URL
      .revokeObjectURL === "undefined"
  ) {
    Object.defineProperty(
      (globalThis as unknown as { URL: { revokeObjectURL?: unknown } }).URL,
      "revokeObjectURL",
      {
        configurable: true,
        writable: true,
        value: jest.fn(),
      },
    );
  }
}

// IntersectionObserver mock

if (
  typeof (globalThis as unknown as { IntersectionObserver?: unknown })
    .IntersectionObserver === "undefined"
) {
  class IntersectionObserverMock {
    private cb: IntersectionObserverCallback;
    constructor(cb: IntersectionObserverCallback) {
      this.cb = cb;
    }
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: IntersectionObserverMock as unknown as typeof IntersectionObserver,
  });
}
