import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import InfiniteBrowse from "@/app/browse/InfiniteBrowse";

describe("InfiniteBrowse", () => {
  const originalFetch = global.fetch;
  const originalIO = (global as any).IntersectionObserver;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    (global as any).IntersectionObserver = originalIO;
  });

  it("renders initial items and loads more on intersection", async () => {
    let ioCb: any = null;
    (global as any).IntersectionObserver = class {
      constructor(cb: any) {
        ioCb = cb;
      }
      observe() {
        if (ioCb) ioCb([{ isIntersecting: true }]);
      }
      disconnect() {}
      unobserve() {}
      takeRecords() {
        return [];
      }
    } as any;

    // First fetch returns two items
    const page1 = {
      items: [{ id: "a", title: "A", price: 1, images: [] }],
      nextCursor: "c1",
      hasNextPage: true,
    };
    const page2 = {
      items: [{ id: "b", title: "B", price: 2, images: [] }],
      nextCursor: null,
      hasNextPage: false,
    };

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => page1 })
      .mockResolvedValueOnce({ ok: true, json: async () => page2 });

    global.fetch = fetchMock as any;

    render(
      <InfiniteBrowse
        initialItems={[]}
        initialCursor={null}
        initialHasNext={true}
      />,
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    // After initial load, first item should be visible
    await waitFor(() => expect(screen.getByText("A")).toBeInTheDocument());

    // load next page
    await waitFor(() => expect(screen.getByText("B")).toBeInTheDocument());
  });

  it("shows no items message when nothing returned", async () => {
    (global as any).IntersectionObserver = class {
      constructor(cb: any) {}
      observe() {}
      disconnect() {}
      unobserve() {}
      takeRecords() {
        return [];
      }
    } as any;
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [], nextCursor: null, hasNextPage: false }),
      }) as any;

    render(
      <InfiniteBrowse
        initialItems={[]}
        initialCursor={null}
        initialHasNext={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/No items available/i)).toBeInTheDocument();
    });
  });

  it("stops when server returns only duplicate items (dedupe path)", async () => {
    // initial item already seen
    const initialItems = [{ id: "dup", title: "Dup", price: 1, images: [] }];

    // server returns same id -> newItems will be empty and component should stop
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [{ id: "dup", title: "Dup", price: 1 }],
          nextCursor: "c2",
          hasNextPage: true,
        }),
      }) as any;

    (global as any).IntersectionObserver = class {
      constructor(cb: any) {}
      observe() {}
      disconnect() {}
      unobserve() {}
      takeRecords() {
        return [];
      }
    } as any;

    render(
      <InfiniteBrowse
        initialItems={initialItems as any}
        initialCursor={null}
        initialHasNext={true}
      />,
    );

    // initial item present
    expect(screen.getByText(/Dup/)).toBeInTheDocument();

    // since newItems empty the component should not append duplicates
    const dups = screen.getAllByText(/Dup/);
    expect(dups.length).toBe(1);
  });
});
