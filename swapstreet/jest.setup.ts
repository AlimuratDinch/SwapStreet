process.env.NEXT_PUBLIC_API_URL = "http://backend:8080";

if (!(global as any).URL.createObjectURL) {
  Object.defineProperty((global as any).URL, "createObjectURL", {
    configurable: true,
    writable: true,
    value: jest.fn(() => "blob:mock"),
  });
}

if (typeof (global as any).IntersectionObserver === "undefined") {
  class IntersectionObserverMock {
    callback: any;
    constructor(cb: any) {
      this.callback = cb;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  Object.defineProperty(global, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: IntersectionObserverMock,
  });
}

if (!(global as any).URL.revokeObjectURL) {
  Object.defineProperty((global as any).URL, "revokeObjectURL", {
    configurable: true,
    writable: true,
    value: jest.fn(),
  });
}
