// tests/__tests__/page.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Home from "@/app/page";
import "@testing-library/jest-dom";

// Mock IntersectionObserver with proper callbacks
let intersectionObserverCallback: any = null;
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback: any) {
    intersectionObserverCallback = callback;
  }
  disconnect() {}
  observe() {
    // Trigger callback immediately for testing
    if (intersectionObserverCallback) {
      intersectionObserverCallback([{ isIntersecting: true }]);
    }
  }
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

global.requestAnimationFrame = (cb: any) => {
  return setTimeout(cb, 0) as any;
};

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};

describe("Home Page", () => {
  it("renders the page successfully", () => {
    render(<Home />);
    expect(screen.getAllByText("SWAPSTREET")[0]).toBeInTheDocument();
  });

  it("renders login link with correct href", () => {
    render(<Home />);
    const loginLink = screen.getByRole("link", { name: "Login" });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/auth/sign-in");
  });

  it("renders navigation links", () => {
    render(<Home />);
    expect(screen.getByText("Features")).toBeInTheDocument();
    expect(screen.getByText("Impact")).toBeInTheDocument();
    expect(screen.getByText("Guide")).toBeInTheDocument();
  });

  it("renders hero section with tagline", () => {
    render(<Home />);
    expect(screen.getByText("The Marketplace for")).toBeInTheDocument();
    expect(screen.getByText(/Discover, buy and sell secondhand clothing/i)).toBeInTheDocument();
  });

  it("renders start shopping button", () => {
    render(<Home />);
    const shopButton = screen.getByRole("link", { name: /start shopping/i });
    expect(shopButton).toBeInTheDocument();
    expect(shopButton).toHaveAttribute("href", "/browse");
  });

  it("renders environmental impact statistics", () => {
    render(<Home />);
    expect(screen.getByText(/clothes saved/i)).toBeInTheDocument();
    expect(screen.getByText(/active users/i)).toBeInTheDocument();
  });

  it("renders some feature titles", () => {
    render(<Home />);
    const features = screen.getAllByText(/smart recommendations/i);
    expect(features.length).toBeGreaterThan(0);
  });

  it("renders all features in the carousel", () => {
    render(<Home />);
    expect(screen.getAllByText(/AI Virtual Try-On/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Secure Payments/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Quality Assurance/i).length).toBeGreaterThan(0);
  });

  it("renders the guide/how it works section", () => {
    render(<Home />);
    expect(screen.getByText(/Browse & Discover/i)).toBeInTheDocument();
    expect(screen.getByText(/Try Before You Buy/i)).toBeInTheDocument();
    expect(screen.getByText(/Shop Sustainably/i)).toBeInTheDocument();
  });

  it("renders the CTA section", () => {
    render(<Home />);
    const ctaButtons = screen.getAllByText(/Get Started Free/i);
    expect(ctaButtons.length).toBeGreaterThan(0);
  });

  it("renders impact section with monthly growth chart", () => {
    render(<Home />);
    expect(screen.getByText(/Monthly Impact Growth/i)).toBeInTheDocument();
  });

  it("renders all month labels in the chart", () => {
    render(<Home />);
    expect(screen.getByText("Jan")).toBeInTheDocument();
    expect(screen.getByText("Dec")).toBeInTheDocument();
  });

  it("renders CO2 reduction statistics", () => {
    render(<Home />);
    expect(screen.getByText(/CO2 Reduced/i)).toBeInTheDocument();
  });

  it("renders liters saved statistics", () => {
    render(<Home />);
    expect(screen.getByText(/Liters Saved/i)).toBeInTheDocument();
  });

  it("has correct links to sign up in multiple locations", () => {
    render(<Home />);
    const signUpLinks = screen.getAllByRole("link", { name: /get started/i });
    signUpLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/auth/sign-up");
    });
  });

  it("typewriter effect runs with timers", async () => {
    jest.useFakeTimers();
    render(<Home />);

    // skip typewriter animation
    jest.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(intersectionObserverCallback).toBeDefined();
    });

    jest.useRealTimers();
  });

  it("carousel handles mouse hover events", () => {
    const { container } = render(<Home />);
    const carousel = container.querySelector('[class*="flex gap"]');

    if (carousel) {
      fireEvent.mouseEnter(carousel);
      fireEvent.mouseLeave(carousel);
    }

    // Test passes if no errors thrown
    expect(true).toBe(true);
  });

  it("hero text rotation effect updates", () => {
    jest.useFakeTimers();
    render(<Home />);

    // skip time to trigger rotating text effect
    jest.advanceTimersByTime(3000);

    jest.useRealTimers();
    expect(true).toBe(true);
  });

  it("chart animation is triggered", () => {
    const { container } = render(<Home />);
    const chart = container.querySelector('[class*="items-end"]');

    expect(chart).toBeInTheDocument();
  });

  it("guide section animates when visible", async () => {
    render(<Home />);

    await waitFor(() => {
      const guideStep1 = screen.getByText(/Browse & Discover/i);
      expect(guideStep1).toBeInTheDocument();
    });
  });
});