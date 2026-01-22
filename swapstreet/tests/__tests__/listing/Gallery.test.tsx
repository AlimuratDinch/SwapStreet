import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Gallery from "@/app/listing/[id]/Gallery";

describe("Gallery", () => {
  it("renders main image and thumbnails, and changes main image on thumbnail click", () => {
    const images = [
      { imageUrl: "https://example.com/a.jpg" },
      { imageUrl: "https://example.com/b.jpg" },
    ];

    render(<Gallery images={images} />);

    // main image
    const main = screen.getByAltText("image-0") as HTMLImageElement;
    expect(main).toBeInTheDocument();
    expect(main.src).toContain("/a.jpg");

    // thumbnails
    const thumb1 = screen.getByAltText("thumb-1");
    fireEvent.click(thumb1);

    const mainAfter = screen.getByAltText("image-1") as HTMLImageElement;
    expect(mainAfter).toBeInTheDocument();
    expect(mainAfter.src).toContain("/b.jpg");
  });

  it("shows fallback when no images", () => {
    render(<Gallery images={[]} />);
    expect(screen.getByText(/No images/i)).toBeInTheDocument();
  });

  it("normalizes minio hostnames to window.location.hostname and handles prev/next wrap", async () => {
    // Mock window.location
    (window as any).location = new URL("http://localhost");

    const images = [
      { imageUrl: "http://minio:9000/public/a.jpg" },
      { imageUrl: "http://minio:9000/public/b.jpg" },
      { imageUrl: "not-a-url" },
    ];

    render(<Gallery images={images} />);

    // Initial main image should normalize minio URL
    const main = screen.getByAltText("image-0") as HTMLImageElement;
    expect(main).toBeInTheDocument();
    expect(main.src).toContain(window.location.hostname);

    // Navigate using next/prev buttons
    const next = screen.getByLabelText("next");
    const prev = screen.getByLabelText("previous");

    // Move to index 1
    fireEvent.click(next);
    await screen.findByAltText("image-1");
    const img1 = screen.getByAltText("image-1") as HTMLImageElement;
    expect(img1.src).toContain("/b.jpg");

    // Move to index 2
    fireEvent.click(next);
    await screen.findByAltText("image-2");
    expect(screen.getByAltText("image-2")).toBeInTheDocument();

    // Wrap back to 0
    fireEvent.click(next);
    await screen.findByAltText("image-0");
    expect(screen.getByAltText("image-0")).toBeInTheDocument();

    // Prev from 0 wraps to last
    fireEvent.click(prev);
    await screen.findByAltText("image-2");
    expect(screen.getByAltText("image-2")).toBeInTheDocument();
  });

  it("renders thumbnail fallback when thumbnail src missing", () => {
    const images = [{}, {}];
    render(<Gallery images={images as any} />);
    // Find a button that contains the fallback div
    const fallback = screen
      .getAllByRole("button")
      .find((b) => b.querySelector("div"));
    expect(fallback).toBeTruthy();
  });
});
