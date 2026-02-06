import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import InfiniteBrowse from "@/app/browse/InfiniteBrowse";

describe("InfiniteBrowse", () => {
  const originalFetch = global.fetch;
  const originalIO = (
    globalThis as unknown as { IntersectionObserver?: unknown }
  ).IntersectionObserver;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    (
      globalThis as unknown as { IntersectionObserver?: unknown }
    ).IntersectionObserver = originalIO;
  });

  it("renders initial items and loads more on intersection", async () => {
    // First fetch returns two pages (first then next)
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

    global.fetch = fetchMock as unknown as typeof global.fetch;

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

    // Scrolling to bottom to trigger load (next page)
    const container = screen.getByRole("main");
    Object.defineProperty(container, "clientHeight", { value: 600 });
    Object.defineProperty(container, "scrollHeight", { value: 700 });
    Object.defineProperty(container, "scrollTop", { value: 100 });
    await act(async () => {
      container.dispatchEvent(new Event("scroll"));
    });

    // load next page
    await waitFor(() => expect(screen.getByText("B")).toBeInTheDocument());
  });

  it("shows no items message when nothing returned", async () => {
    class IO2 {
      constructor() {}
      observe(): void {}
      disconnect(): void {}
      unobserve(): void {}
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
    }
    (
      globalThis as unknown as { IntersectionObserver?: unknown }
    ).IntersectionObserver = IO2 as unknown as typeof IntersectionObserver;
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [], nextCursor: null, hasNextPage: false }),
    }) as unknown as typeof global.fetch;

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
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [{ id: "dup", title: "Dup", price: 1 }],
        nextCursor: "c2",
        hasNextPage: true,
      }),
    }) as unknown as typeof global.fetch;

    class IO3 {
      constructor() {}
      observe(): void {}
      disconnect(): void {}
      unobserve(): void {}
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
    }
    (
      globalThis as unknown as { IntersectionObserver?: unknown }
    ).IntersectionObserver = IO3 as unknown as typeof IntersectionObserver;

    render(
      <InfiniteBrowse
        initialItems={
          initialItems as unknown as {
            id: string;
            title: string;
            price: number;
            images?: { imageUrl: string }[];
          }[]
        }
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

  it("stops when nextCursor equals previous cursor (no further loads)", async () => {
    const page = {
      items: [{ id: "x", title: "X", price: 1, images: [] }],
      nextCursor: "same",
      hasNextPage: true,
    };

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => page });
    global.fetch = fetchMock as unknown as typeof global.fetch;

    render(
      <InfiniteBrowse
        initialItems={[]}
        initialCursor={"same"}
        initialHasNext={true}
      />,
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    // Scrolling should NOT trigger fetch
    const container = screen.getByRole("main");
    Object.defineProperty(container, "clientHeight", { value: 600 });
    Object.defineProperty(container, "scrollHeight", { value: 700 });
    Object.defineProperty(container, "scrollTop", { value: 100 });

    await act(async () => {
      container.dispatchEvent(new Event("scroll"));
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries on failure with backoff and succeeds on retry", async () => {
    jest.useFakeTimers();
    const page = {
      items: [{ id: "r1", title: "Retry", price: 5, images: [] }],
      nextCursor: null,
      hasNextPage: false,
    };

    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ ok: true, json: async () => page });

    global.fetch = fetchMock as unknown as typeof global.fetch;

    render(
      <InfiniteBrowse
        initialItems={[]}
        initialCursor={null}
        initialHasNext={true}
      />,
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Retry")).toBeInTheDocument();

    jest.useRealTimers();
  });

  it("handles API returning array directly", async () => {
    const pageArr = [{ id: "arr1", title: "Arr", price: 2, images: [] }];
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => pageArr,
    }) as unknown as typeof global.fetch;

    render(
      <InfiniteBrowse
        initialItems={[]}
        initialCursor={null}
        initialHasNext={true}
      />,
    );

    await waitFor(() => expect(screen.getByText("Arr")).toBeInTheDocument());
  });
});
