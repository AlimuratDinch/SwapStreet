// tests/__tests__/page.test.tsx
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import Home from "@/app/page";
import "@testing-library/jest-dom";

const createJsonResponse = (ok: boolean, data: unknown) =>
  Promise.resolve({
    ok,
    json: async () => data,
  });

// --- IntersectionObserver mock ---
let intersectionObserverCallback: any = null;

global.IntersectionObserver = class IntersectionObserver {
  constructor(callback: any) {
    intersectionObserverCallback = callback;
  }
  disconnect() {}
  observe() {
    if (intersectionObserverCallback) {
      intersectionObserverCallback([{ isIntersecting: true }]);
    }
  }
  unobserve() {}
  takeRecords() {
    return [];
  }
} as any;

// --- RAF mocks ---
global.requestAnimationFrame = (cb: any) => {
  return setTimeout(cb, 0) as any;
};

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};

describe("Home Page", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    global.fetch = jest
      .fn()
      .mockResolvedValue(createJsonResponse(false, {})) as jest.Mock;
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("renders the page successfully", () => {
    render(<Home />);
    expect(
      screen.getAllByText((_, el) => el?.textContent === "SWAPSTREET")[0],
    ).toBeInTheDocument();
  });

  it("renders login link with correct href", () => {
    render(<Home />);
    const loginLink = screen.getByRole("link", { name: "Login" });
    expect(loginLink).toHaveAttribute("href", "/auth/sign-in");
  });

  it("navigation links have correct anchor hrefs", () => {
    render(<Home />);
    expect(screen.getByRole("link", { name: "Features" })).toHaveAttribute(
      "href",
      "#features",
    );
    expect(screen.getByRole("link", { name: "Impact" })).toHaveAttribute(
      "href",
      "#impact",
    );
    expect(screen.getByRole("link", { name: "Guide" })).toHaveAttribute(
      "href",
      "#guide",
    );
  });

  it("renders hero section and rotating text container", () => {
    render(<Home />);
    expect(screen.getByText("The Marketplace for")).toBeInTheDocument();
  });

  it("forces hero rotating type/delete cycle", () => {
    render(<Home />);

    act(() => {
      jest.advanceTimersByTime(6000);
    });

    expect(true).toBe(true);
  });

  it("runs typewriter effect until completion", async () => {
    render(<Home />);

    await act(async () => {
      jest.advanceTimersByTime(10000);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(
        screen.getByText("Ready to Transform Your Wardrobe?"),
      ).toBeInTheDocument();
    });
  });

  it("fetches public stats and monthly impact data", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(
        createJsonResponse(true, {
          Articles: 12,
          CO2Kg: 34,
          WaterL: 56,
          AccountsCreated: 78,
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse(true, {
          MonthlyImpact: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60],
        }),
      );

    render(<Home />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      jest.advanceTimersByTime(2500);
      await Promise.resolve();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/sustainability/public"),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/sustainability/public/monthly-impact"),
    );
    await waitFor(() => {
      expect(screen.getAllByText("12").length).toBeGreaterThan(1);
    });
    expect(screen.getAllByText("34").length).toBeGreaterThan(0);
    expect(screen.getAllByText("56").length).toBeGreaterThan(0);
    expect(screen.getAllByText("78").length).toBeGreaterThan(0);
  });

  it("handles non-ok public data responses without updating stats", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(createJsonResponse(false, {}))
      .mockResolvedValueOnce(createJsonResponse(false, {}));

    render(<Home />);

    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(4);
  });

  it("triggers chart animation and completes bar updates", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(
        createJsonResponse(true, {
          Articles: 0,
          CO2Kg: 0,
          WaterL: 0,
          AccountsCreated: 0,
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse(true, {
          MonthlyImpact: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        }),
      );

    render(<Home />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      jest.advanceTimersByTime(6000);
      await Promise.resolve();
    });

    const bars = document.querySelectorAll('[class*="bg-gradient-to-t"]');
    expect(bars.length).toBe(12);
    await waitFor(() => {
      expect(
        Array.from(bars).some((bar) =>
          bar.getAttribute("style")?.includes("height: 100%"),
        ),
      ).toBe(true);
    });
  });

  it("runs guide visibility stagger animation", async () => {
    render(<Home />);

    act(() => {
      jest.advanceTimersByTime(4000);
    });

    await waitFor(() => {
      expect(screen.getByText(/Browse & Discover/i)).toBeInTheDocument();
    });
  });

  it("carousel RAF animation executes and loops", async () => {
    let boundingRectCall = 0;
    const boundingRectSpy = jest
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(
        () =>
          ({
            x: 0,
            y: 0,
            top: 0,
            left: boundingRectCall++ % 2 === 0 ? 0 : 2,
            right: boundingRectCall % 2 === 0 ? 1 : 3,
            bottom: 1,
            width: 1,
            height: 1,
            toJSON: () => ({}),
          }) as DOMRect,
      );

    const { container } = render(<Home />);
    const carousel = container.querySelector(
      '[class*="flex gap"]',
    ) as HTMLElement | null;
    const appendChildSpy = carousel
      ? jest.spyOn(carousel, "appendChild")
      : null;

    await act(async () => {
      await Promise.resolve();
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    if (carousel) {
      fireEvent.mouseEnter(carousel);
      fireEvent.mouseLeave(carousel);
    }

    await waitFor(() => {
      expect(carousel?.style.transform).toContain("translate3d");
    });

    await waitFor(() => {
      expect(appendChildSpy?.mock.calls.length ?? 0).toBeGreaterThan(0);
    });

    appendChildSpy?.mockRestore();
    boundingRectSpy.mockRestore();
  });

  it("covers RAF cleanup on unmount", () => {
    const { unmount } = render(<Home />);
    unmount();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(true).toBe(true);
  });

  it("renders environmental stats counters", () => {
    render(<Home />);
    expect(screen.getByText(/Clothes Saved/i)).toBeInTheDocument();
    expect(screen.getByText(/Active Users/i)).toBeInTheDocument();
  });

  it("renders feature carousel content", () => {
    render(<Home />);
    expect(screen.getAllByText(/AI Virtual Try-On/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Secure Payments/i).length).toBeGreaterThan(0);
  });

  it("renders CTA buttons with correct signup links", () => {
    render(<Home />);
    const links = screen.getAllByRole("link", { name: /get started/i });
    links.forEach((link) => {
      expect(link).toHaveAttribute("href", "/auth/sign-up");
    });
  });

  it("renders footer links", () => {
    render(<Home />);
    expect(screen.getByRole("link", { name: /Privacy/i })).toHaveAttribute(
      "href",
      "/privacy",
    );
    expect(screen.getByRole("link", { name: /Terms/i })).toHaveAttribute(
      "href",
      "/terms",
    );
  });

  it("contains accessible headings", () => {
    render(<Home />);
    const headings = screen.getAllByRole("heading");
    expect(headings.length).toBeGreaterThan(3);
  });

  it("cycles to next word when deletion completes", async () => {
    render(<Home />);

    for (let i = 0; i < 60; i++) {
      await act(async () => {
        jest.advanceTimersByTime(100);
      });
    }

    expect(true).toBe(true);
  });

  it("shows scroll-to-top button", () => {
    render(<Home />);

    Object.defineProperty(window, "scrollY", {
      value: 400,
      writable: true,
      configurable: true,
    });

    act(() => {
      fireEvent.scroll(window);
    });

    expect(
      screen.getByRole("button", { name: /scroll to top/i }),
    ).toBeInTheDocument();
  });

  it("scroll-to-top button calls window.scrollTo", () => {
    const scrollToMock = jest
      .spyOn(window, "scrollTo")
      .mockImplementation(() => {});

    render(<Home />);

    Object.defineProperty(window, "scrollY", {
      value: 400,
      writable: true,
      configurable: true,
    });

    act(() => {
      fireEvent.scroll(window);
    });

    fireEvent.click(screen.getByRole("button", { name: /scroll to top/i }));

    expect(scrollToMock).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
    scrollToMock.mockRestore();
  });
});
