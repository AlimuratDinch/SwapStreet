import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import SustainabilityDashboard, {
  CustomTooltip,
} from "@/app/sustainability/page";

const mockGetItem = jest.fn();

// Mock the Header component
jest.mock("@/components/common/Header", () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

// Mock Recharts components
jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({
    children,
    data,
  }: {
    children: React.ReactNode;
    data: unknown[];
  }) => (
    <div data-testid="bar-chart" data-length={data.length}>
      {children}
    </div>
  ),
  Bar: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar">{children}</div>
  ),
  Cell: ({ fill, onClick }: { fill: string; onClick: () => void }) => (
    <div data-testid="bar-cell" data-fill={fill} onClick={onClick} />
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: ({ content }: { content: React.ReactElement }) => (
    <div data-testid="tooltip">{content}</div>
  ),
}));

describe("SustainabilityDashboard", () => {
  beforeEach(() => {
    // Mock current date to April (month index 3)
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-04-15").getTime());
    mockGetItem.mockReset();
    jest.spyOn(Storage.prototype, "getItem").mockImplementation((key) => {
      if (key === "accessToken") {
        return mockGetItem();
      }
      return null;
    });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  describe("Page Structure", () => {
    it("renders the header component", () => {
      render(<SustainabilityDashboard />);
      expect(screen.getByTestId("header")).toBeInTheDocument();
    });

    it("renders the main title and description", () => {
      render(<SustainabilityDashboard />);
      expect(screen.getByText("Sustainability Overview")).toBeInTheDocument();
      expect(
        screen.getByText("Detailed insights into your impact"),
      ).toBeInTheDocument();
    });

    it("renders the impact summary section", () => {
      render(<SustainabilityDashboard />);
      expect(screen.getByText("Impact Summary")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Track your performance changes and environmental progress over time",
        ),
      ).toBeInTheDocument();
    });
  });

  describe("StatCards", () => {
    it("renders all 6 stat cards", () => {
      render(<SustainabilityDashboard />);

      const zeroValues = screen.getAllByText("0");
      expect(zeroValues.length).toBeGreaterThanOrEqual(6);

      expect(
        screen.getByText("Metric tons of CO₂ avoided"),
      ).toBeInTheDocument();
      expect(screen.getByText("Gallons of water saved")).toBeInTheDocument();
      expect(screen.getByText("Individual clothes saved")).toBeInTheDocument();
      expect(screen.getByText("Kwh of electricity saved")).toBeInTheDocument();
      expect(
        screen.getByText("Kg of toxic dye chemicals avoided"),
      ).toBeInTheDocument();
      expect(screen.getByText("m² of land preserved")).toBeInTheDocument();
    });

    it("highlights the first card by default", () => {
      const { container } = render(<SustainabilityDashboard />);
      const cards = container.querySelectorAll(".border-2");

      expect(cards[0]).toHaveClass("border-blue-500", "shadow-md");
      expect(cards[1]).toHaveClass("border-gray-200");
    });

    it("changes selected card when clicking on a different card", () => {
      const { container } = render(<SustainabilityDashboard />);
      const cards = container.querySelectorAll(".cursor-pointer");

      // Click on the second card (Gallons of water saved)
      fireEvent.click(cards[1]);

      expect(cards[0]).toHaveClass("border-gray-200");
      expect(cards[1]).toHaveClass("border-blue-500", "shadow-md");
    });

    it("allows clicking between multiple cards", () => {
      const { container } = render(<SustainabilityDashboard />);
      const cards = container.querySelectorAll(".cursor-pointer");

      // Click third card
      fireEvent.click(cards[2]);
      expect(cards[2]).toHaveClass("border-blue-500", "shadow-md");

      // Click fifth card
      fireEvent.click(cards[4]);
      expect(cards[2]).toHaveClass("border-gray-200");
      expect(cards[4]).toHaveClass("border-blue-500", "shadow-md");
    });

    it("applies correct color classes to each card", () => {
      const { container } = render(<SustainabilityDashboard />);
      const iconContainers = container.querySelectorAll(".rounded-full");

      expect(iconContainers[0]).toHaveClass("bg-green-50", "text-green-500");
      expect(iconContainers[1]).toHaveClass("bg-blue-50", "text-blue-400");
      expect(iconContainers[2]).toHaveClass("bg-orange-50", "text-orange-400");
      expect(iconContainers[3]).toHaveClass("bg-yellow-50", "text-yellow-400");
      expect(iconContainers[4]).toHaveClass("bg-purple-50", "text-purple-400");
      expect(iconContainers[5]).toHaveClass("bg-red-50", "text-red-400");
    });

    it("selects the last stat card when clicked", () => {
      const { container } = render(<SustainabilityDashboard />);
      const cards = container.querySelectorAll(".cursor-pointer");

      fireEvent.click(cards[5]);

      expect(cards[5]).toHaveClass("border-blue-500", "shadow-md");
      expect(cards[0]).toHaveClass("border-gray-200");
    });
  });

  describe("Data Loading", () => {
    it("keeps the empty state when no access token is available", () => {
      mockGetItem.mockReturnValue(null);

      render(<SustainabilityDashboard />);

      expect(global.fetch).not.toHaveBeenCalled();
      expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(6);
    });

    it("maps API stats with canonical keys", async () => {
      mockGetItem.mockReturnValue("token-123");

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            CO2Kg: 12,
            WaterL: 34,
            ElectricityKWh: 56,
            ToxicChemicalsG: 78,
            LandfillKg: 90,
            Articles: 11,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            CO2Kg: 120,
            WaterL: 340,
            ElectricityKWh: 560,
            ToxicChemicalsG: 780,
            LandfillKg: 900,
            Articles: 110,
          }),
        });

      render(<SustainabilityDashboard />);

      expect(await screen.findByText("12")).toBeInTheDocument();
      expect(screen.getByText("34")).toBeInTheDocument();
      expect(screen.getByText("11")).toBeInTheDocument();
      expect(screen.getByText("56")).toBeInTheDocument();
      expect(screen.getByText("78")).toBeInTheDocument();
      expect(screen.getByText("90")).toBeInTheDocument();
    });

    it("maps API stats with lowercase fallback keys", async () => {
      mockGetItem.mockReturnValue("token-123");

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            co2Kg: 1,
            waterL: 2,
            electricityKWh: 3,
            toxicChemicals: 4,
            landfillKg: 5,
            articles: 6,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            co2Kg: 10,
            waterL: 20,
            electricityKWh: 30,
            toxicChemicals: 40,
            landfillKg: 50,
            articles: 60,
          }),
        });

      render(<SustainabilityDashboard />);

      expect(await screen.findByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("6")).toBeInTheDocument();
    });

    it("keeps default stats when the fetch request fails", async () => {
      mockGetItem.mockReturnValue("token-123");
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("boom"));

      render(<SustainabilityDashboard />);

      expect(await screen.findAllByText("0")).not.toHaveLength(0);
      expect(global.fetch).toHaveBeenCalled();
    });
    it("ignores non-ok responses from both sustainability endpoints", async () => {
      mockGetItem.mockReturnValue("token-123");

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, json: async () => ({}) })
        .mockResolvedValueOnce({ ok: false, json: async () => ({}) });

      render(<SustainabilityDashboard />);

      expect(await screen.findAllByText("0")).not.toHaveLength(0);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("Chart", () => {
    it("renders the chart title", () => {
      render(<SustainabilityDashboard />);
      expect(screen.getByText("Monthly Usage")).toBeInTheDocument();
    });

    it("renders the bar chart with correct data", () => {
      render(<SustainabilityDashboard />);
      const barChart = screen.getByTestId("bar-chart");
      expect(barChart).toHaveAttribute("data-length", "12");
    });

    it("renders chart components", () => {
      render(<SustainabilityDashboard />);
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
      expect(screen.getByTestId("x-axis")).toBeInTheDocument();
      expect(screen.getByTestId("y-axis")).toBeInTheDocument();
      expect(screen.getByTestId("cartesian-grid")).toBeInTheDocument();
      expect(screen.getByTestId("tooltip")).toBeInTheDocument();
    });

    it("highlights the current month (April) by default", () => {
      render(<SustainabilityDashboard />);
      const cells = screen.getAllByTestId("bar-cell");

      // April is index 3 (0-indexed)
      expect(cells[3]).toHaveAttribute("data-fill", "#0D9488"); // Teal color
      expect(cells[0]).toHaveAttribute("data-fill", "#E5E7EB"); // Gray color
    });

    it("changes highlighted bar when clicking on a bar", () => {
      render(<SustainabilityDashboard />);
      const cells = screen.getAllByTestId("bar-cell");

      // Click on January (index 0)
      fireEvent.click(cells[0]);

      expect(cells[0]).toHaveAttribute("data-fill", "#0D9488");
      expect(cells[3]).toHaveAttribute("data-fill", "#E5E7EB");
    });

    it("allows toggling between different bars", () => {
      render(<SustainabilityDashboard />);
      const cells = screen.getAllByTestId("bar-cell");

      // Click on June (index 5)
      fireEvent.click(cells[5]);
      expect(cells[5]).toHaveAttribute("data-fill", "#0D9488");

      // Click on December (index 11)
      fireEvent.click(cells[11]);
      expect(cells[5]).toHaveAttribute("data-fill", "#E5E7EB");
      expect(cells[11]).toHaveAttribute("data-fill", "#0D9488");
    });
  });

  describe("CustomTooltip", () => {
    it("renders tooltip with correct data when active", () => {
      const mockPayload = [{ name: "Apr", value: 40 }];

      render(<CustomTooltip active={true} payload={mockPayload} />);

      expect(screen.getByText("40")).toBeInTheDocument();
      expect(screen.getByText("Apr 2026")).toBeInTheDocument();
    });

    it("returns null when not active", () => {
      const { container } = render(
        <CustomTooltip active={false} payload={[]} />,
      );

      expect(container.firstChild).toBeNull();
    });

    it("returns null when payload is empty", () => {
      const { container } = render(
        <CustomTooltip active={true} payload={[]} />,
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe("Responsive Design", () => {
    it("applies responsive classes to the main container", () => {
      const { container } = render(<SustainabilityDashboard />);
      const mainDiv = container.firstChild;

      expect(mainDiv).toHaveClass("p-4", "md:p-8", "pt-20", "md:pt-24");
    });

    it("applies responsive grid classes to stat cards", () => {
      const { container } = render(<SustainabilityDashboard />);
      const grid = container.querySelector(".grid");

      expect(grid).toHaveClass(
        "grid-cols-1",
        "md:grid-cols-2",
        "lg:grid-cols-3",
      );
    });
  });

  describe("Integration Tests", () => {
    it("maintains independent state for card selection and bar selection", () => {
      const { container } = render(<SustainabilityDashboard />);
      const cards = container.querySelectorAll(".cursor-pointer");
      const cells = screen.getAllByTestId("bar-cell");

      // Click on card 3
      fireEvent.click(cards[3]);
      expect(cards[3]).toHaveClass("border-blue-500");

      // Click on bar 7
      fireEvent.click(cells[7]);
      expect(cells[7]).toHaveAttribute("data-fill", "#0D9488");

      // Verify both selections are maintained
      expect(cards[3]).toHaveClass("border-blue-500");
      expect(cells[7]).toHaveAttribute("data-fill", "#0D9488");
    });

    it("handles multiple interactions correctly", () => {
      const { container } = render(<SustainabilityDashboard />);
      const cards = container.querySelectorAll(".cursor-pointer");
      const cells = screen.getAllByTestId("bar-cell");

      // Series of interactions
      fireEvent.click(cards[1]); // Click card 2
      fireEvent.click(cells[2]); // Click bar 3
      fireEvent.click(cards[4]); // Click card 5
      fireEvent.click(cells[9]); // Click bar 10

      // Verify final state
      expect(cards[4]).toHaveClass("border-blue-500");
      expect(cells[9]).toHaveAttribute("data-fill", "#0D9488");
    });
  });

  describe("Accessibility", () => {
    it("has proper heading hierarchy", () => {
      render(<SustainabilityDashboard />);

      const h1 = screen.getByRole("heading", { level: 1 });
      expect(h1).toHaveTextContent("Sustainability Overview");

      const h2 = screen.getByRole("heading", { level: 2 });
      expect(h2).toHaveTextContent("Impact Summary");

      const h3 = screen.getByRole("heading", { level: 3 });
      expect(h3).toHaveTextContent("Monthly Usage");
    });

    it("stat cards are keyboard accessible", () => {
      render(<SustainabilityDashboard />);

      const firstCard = screen
        .getByText("Metric tons of CO₂ avoided")
        .closest('[role="button"]');

      expect(firstCard).toBeInTheDocument();
      expect(firstCard).toHaveAttribute("tabindex", "0");
      expect(firstCard).toHaveAttribute("aria-pressed", "true");
    });

    it("changes selected card with Enter and Space keyboard events", () => {
      render(<SustainabilityDashboard />);

      const firstCard = screen
        .getByText("Metric tons of CO₂ avoided")
        .closest('[role="button"]');
      const secondCard = screen
        .getByText("Gallons of water saved")
        .closest('[role="button"]');

      expect(firstCard).toHaveAttribute("aria-pressed", "true");
      expect(secondCard).toHaveAttribute("aria-pressed", "false");

      fireEvent.keyDown(secondCard!, { key: "Enter" });
      expect(secondCard).toHaveAttribute("aria-pressed", "true");
      expect(firstCard).toHaveAttribute("aria-pressed", "false");

      fireEvent.keyDown(firstCard!, { key: " " });
      expect(firstCard).toHaveAttribute("aria-pressed", "true");
      expect(secondCard).toHaveAttribute("aria-pressed", "false");
    });
    it("ignores non-activating keyboard input on stat cards", () => {
      const { container } = render(<SustainabilityDashboard />);
      const cards = container.querySelectorAll(".cursor-pointer");

      fireEvent.keyDown(cards[1], { key: "Escape" });

      expect(cards[0]).toHaveClass("border-blue-500", "shadow-md");
      expect(cards[1]).toHaveClass("border-gray-200");
    });
  });
});
