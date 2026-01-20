/* eslint-disable @next/next/no-img-element */
import React from "react";
import { render, screen, act } from "@testing-library/react";
import type { ImageProps } from "next/image";
import SellerProfilePage from "../../app/seller/[id]/page";

// Mock next/image and next/link for Jest
jest.mock("next/image", () => {
  const MockNextImage = (props: ImageProps) => (
    <img {...props} alt={props.alt ?? "image"} />
  );
  MockNextImage.displayName = "MockNextImage";
  return MockNextImage;
});

jest.mock("next/link", () => {
  const MockLink = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

describe("SellerProfilePage", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders default seller data when not owner", async () => {
    const params = Promise.resolve({ id: "123" });

    await act(async () => {
      render(<SellerProfilePage params={params} />);
    });

    expect(screen.getByText("No listings yet")).toBeInTheDocument();
    expect(screen.getByText("Listings")).toBeInTheDocument();
    expect(screen.getByText("About")).toBeInTheDocument();
  });

  it("renders edit button when owner (id = me)", async () => {
    const params = Promise.resolve({ id: "me" });
    await act(async () => {
      render(<SellerProfilePage params={params} />);
    });
    expect(screen.getByText("Edit Profile")).toBeInTheDocument();
  });

  it("loads onboarding data from localStorage when owner", async () => {
    localStorage.setItem(
      "seller:me",
      JSON.stringify({
        name: "Alice",
        location: "Wonderland",
        bio: "Adventurer",
        avatarUrl: "blob:avatar123",
        bannerUrl: "blob:banner123",
      }),
    );
    const params = Promise.resolve({ id: "me" });

    await act(async () => {
      render(<SellerProfilePage params={params} />);
    });

    // Verify that onboarding data rendered
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Wonderland")).toBeInTheDocument();
    expect(screen.getByText("Adventurer")).toBeInTheDocument();
  });

  it("handles invalid JSON in localStorage gracefully", async () => {
    localStorage.setItem("seller:me", "{ invalid json");
    const params = Promise.resolve({ id: "me" });

    await act(async () => {
      render(<SellerProfilePage params={params} />);
    });

    // Should still render safely without crashing
    expect(screen.getByText("Listings")).toBeInTheDocument();
  });
});
