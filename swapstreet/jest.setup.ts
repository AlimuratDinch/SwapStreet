process.env.NEXT_PUBLIC_API_URL = "http://backend:8080";

if (!(global as any).URL.createObjectURL) {
  Object.defineProperty((global as any).URL, "createObjectURL", {
    configurable: true,
    writable: true,
    value: jest.fn(() => "blob:mock"),
  });
}

if (!(global as any).URL.revokeObjectURL) {
  Object.defineProperty((global as any).URL, "revokeObjectURL", {
    configurable: true,
    writable: true,
    value: jest.fn(),
  });
}


