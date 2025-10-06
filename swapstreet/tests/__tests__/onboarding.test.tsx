// tests/__tests__/onboarding.test.tsx
import { render, screen } from "@testing-library/react";
import Onboarding from "@/app/seller/onboarding/page";
import "@testing-library/jest-dom";

// Mock router for client component
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe("Seller Onboarding Page", () => {
  it("renders the onboarding heading", () => {
    render(<Onboarding />);
    expect(
      screen.getByText(
        (content, element) =>
          element?.textContent === "Set up your seller profile",
      ),
    ).toBeInTheDocument();
  });
});
