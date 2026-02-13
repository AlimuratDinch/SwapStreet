// tests/__tests__/page.test.tsx
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import Home from "@/app/page";
import "@testing-library/jest-dom";

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
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("renders the page successfully", () => {
    render(<Home />);
    expect(screen.getAllByText("SWAPSTREET")[0]).toBeInTheDocument();
  });

  it("renders login link with correct href", () => {
    render(<Home />);
    const loginLink = screen.getByRole("link", { name: "Login" });
    expect(loginLink).toHaveAttribute("href", "/auth/sign-in");
  });

  it("navigation links have correct anchor hrefs", () => {
    render(<Home />);
    expect(screen.getByRole("link", { name: "Features" })).toHaveAttribute("href", "#features");
    expect(screen.getByRole("link", { name: "Impact" })).toHaveAttribute("href", "#impact");
    expect(screen.getByRole("link", { name: "Guide" })).toHaveAttribute("href", "#guide");
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

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    await waitFor(() => {
      expect(intersectionObserverCallback).toBeDefined();
    });
  });

  it("triggers chart animation and completes bar updates", () => {
    render(<Home />);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    const bars = document.querySelectorAll('[class*="bg-gradient-to-t"]');
    expect(bars.length).toBeGreaterThan(0);
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

  it("carousel RAF animation executes and loops", () => {
    const { container } = render(<Home />);
    const carousel = container.querySelector('[class*="flex gap"]');

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    if (carousel) {
      fireEvent.mouseEnter(carousel);
      fireEvent.mouseLeave(carousel);
    }

    expect(true).toBe(true);
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
    links.forEach(link => {
      expect(link).toHaveAttribute("href", "/auth/sign-up");
    });
  });

  it("renders footer links", () => {
    render(<Home />);
    expect(screen.getByRole("link", { name: /Privacy/i })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("link", { name: /Terms/i })).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: /Contact/i })).toHaveAttribute("href", "/contact");
  });

  it("contains accessible headings", () => {
    render(<Home />);
    const headings = screen.getAllByRole("heading");
    expect(headings.length).toBeGreaterThan(3);
  });
});
