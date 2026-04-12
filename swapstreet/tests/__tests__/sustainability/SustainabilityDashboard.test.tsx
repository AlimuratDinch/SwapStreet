import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import SustainabilityDashboard, {
  CustomTooltip,
} from "@/app/sustainability/page";

const mockGetItem = jest.fn();

const flushAnimatedCounters = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });

  act(() => {
    jest.advanceTimersByTime(2500);
  });
};

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
        screen.getByText("Kg of CO2 avoided"),
      ).toBeInTheDocument();
      expect(screen.getByText("Liters of water saved")).toBeInTheDocument();
      expect(screen.getByText("Individual clothes saved")).toBeInTheDocument();
      expect(screen.getByText("Kwh of electricity saved")).toBeInTheDocument();
      expect(
        screen.getByText("Grams of toxic dye chemicals avoided"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Grams not ending up in a landfill"),
      ).toBeInTheDocument();
    });

    it("renders the stat card icon colors", () => {
      const { container } = render(<SustainabilityDashboard />);
      const cards = container.querySelectorAll(".relative.rounded-xl");

      expect(cards).toHaveLength(6);

      expect(cards[0].querySelector(".rounded-full")).toHaveClass(
        "bg-green-50",
        "text-green-500",
      );
      expect(cards[1].querySelector(".rounded-full")).toHaveClass(
        "bg-blue-50",
        "text-blue-400",
      );
      expect(cards[2].querySelector(".rounded-full")).toHaveClass(
        "bg-orange-50",
        "text-orange-400",
      );
      expect(cards[3].querySelector(".rounded-full")).toHaveClass(
        "bg-yellow-50",
        "text-yellow-400",
      );
      expect(cards[4].querySelector(".rounded-full")).toHaveClass(
        "bg-purple-50",
        "text-purple-400",
      );
      expect(cards[5].querySelector(".rounded-full")).toHaveClass(
        "bg-red-50",
        "text-red-400",
      );
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

      await flushAnimatedCounters();

      expect(screen.getByText("12")).toBeInTheDocument();
      expect(screen.getByText("34")).toBeInTheDocument();
      expect(screen.getByText("11")).toBeInTheDocument();
      expect(screen.getByText("56")).toBeInTheDocument();
      expect(screen.getByText("78")).toBeInTheDocument();
      expect(screen.getByText("90,000")).toBeInTheDocument();
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

  await flushAnimatedCounters();

  expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.getByText("5,000")).toBeInTheDocument();
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
  });

  describe("CustomTooltip", () => {
    it("renders tooltip with correct data when active", () => {
      render(
        <CustomTooltip
          active={true}
          label="Apr"
          stats={{
            CO2Kg: 40,
            WaterL: 80,
            ElectricityKWh: 120,
            ToxicChemicalsG: 160,
            LandfillKg: 2,
            Articles: 10,
          }}
        />,
      );

      expect(screen.getByText("Apr 2026")).toBeInTheDocument();
      expect(screen.getByText("Current month metric breakdown")).toBeInTheDocument();
      expect(screen.getByText("40")).toBeInTheDocument();
    });

    it("returns null when not active", () => {
      const { container } = render(
        <CustomTooltip
          active={false}
          stats={{
            CO2Kg: 0,
            WaterL: 0,
            ElectricityKWh: 0,
            ToxicChemicalsG: 0,
            LandfillKg: 0,
            Articles: 0,
          }}
        />,
      );

      expect(container.firstChild).toBeNull();
    });

    it("shows the empty-state message when active data is zero", () => {
      const { getByText } = render(
        <CustomTooltip
          active={true}
          stats={{
            CO2Kg: 0,
            WaterL: 0,
            ElectricityKWh: 0,
            ToxicChemicalsG: 0,
            LandfillKg: 0,
            Articles: 0,
          }}
        />,
      );

      expect(getByText("No data for this month")).toBeInTheDocument();
    });
  });

  describe("Responsive Design", () => {
    it("applies responsive classes to the main container", () => {
      const { container } = render(<SustainabilityDashboard />);
      const mainDiv = container.firstChild;

      expect(mainDiv).toHaveClass(
        "flex",
        "h-screen",
        "flex-col",
        "overflow-hidden",
        "bg-gray-50",
        "px-3",
        "pt-20",
        "font-sans",
        "md:px-6",
        "md:pt-24",
      );
    });

    it("applies responsive grid classes to stat cards", () => {
      const { container } = render(<SustainabilityDashboard />);
      const grid = container.querySelector(".grid");

      expect(grid).toHaveClass(
        "grid-cols-2",
        "lg:grid-cols-3",
      );
    });
  });

  describe("Integration Tests", () => {
    it("switches between individual and platform views", () => {
      render(<SustainabilityDashboard />);

      expect(screen.getByText("Individual View")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Platform" }));
      expect(screen.getByText("Platform View")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Individual" }));
      expect(screen.getByText("Individual View")).toBeInTheDocument();
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

    it("renders accessible view toggle buttons", () => {
      render(<SustainabilityDashboard />);

      expect(
        screen.getByRole("button", { name: "Individual" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Platform" }),
      ).toBeInTheDocument();
    });

    it("toggles the view buttons with clicks", () => {
      render(<SustainabilityDashboard />);

      fireEvent.click(screen.getByRole("button", { name: "Platform" }));
      expect(screen.getByText("Platform View")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Individual" }));
      expect(screen.getByText("Individual View")).toBeInTheDocument();
    });
  });
});
