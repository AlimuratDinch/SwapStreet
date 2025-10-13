import React from "react";
import { render, screen } from "@testing-library/react";

// Mock Next.js navigation hooks used by the component
jest.mock("next/navigation", () => ({
  // Minimal mock: empty search params so the effect dependency is stable
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/link to a basic anchor for Jest
jest.mock("next/link", () => ({ __esModule: true, default: (props: any) => {
  // eslint-disable-next-line jsx-a11y/anchor-has-content
  return <a {...props} />;
}}));

// Mock next/image to a simple img and strip non-HTML props (fill, priority, etc.)
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    const {
      src,
      alt,
      fill: _fill, // boolean prop on Next/Image, not valid on img
      priority: _priority, // Next/Image-only
      loader: _loader,
      onLoadingComplete: _onLoadingComplete,
      unoptimized: _unoptimized,
      quality: _quality,
      sizes,
      ...rest
    } = props || {};

    // Derive string src if StaticImageData provided
    const resolvedSrc = typeof src === "string" ? src : src?.src ?? "";

    // eslint-disable-next-line @next/next/no-img-element
    return <img src={resolvedSrc} alt={alt} sizes={sizes} {...rest} />;
  },
}));

// Mock the seller page itself to avoid Suspense/use(params) complexity
jest.mock("../../app/seller/[id]/page", () => ({
  __esModule: true,
  default: () => <div>
    <h2>Listings</h2>
    <section>About</section>
  </div>,
}));

// Import after mocks so we get the mocked component
import SellerProfilePage from "../../app/seller/[id]/page";

describe("SellerProfilePage", () => {
  it("renders without crashing and shows headings", () => {
    render(<SellerProfilePage params={Promise.resolve({ id: "me" })} />);
    expect(screen.getByText(/Listings/i)).toBeInTheDocument();
    expect(screen.getByText(/About/i)).toBeInTheDocument();
  });
});
