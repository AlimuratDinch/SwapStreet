import { render, screen, fireEvent } from "@testing-library/react";
import Gallery from "@/app/browse/components/Gallery";

describe("Gallery Component", () => {
  const mockImages = [
    { imageUrl: "http://example.com/image1.jpg" },
    { imageUrl: "http://example.com/image2.jpg" },
    { imageUrl: "http://example.com/image3.jpg" },
  ];

  it("renders empty state when no images provided", () => {
    render(<Gallery images={[]} />);
    expect(screen.getByText("No images")).toBeInTheDocument();
  });

  it("renders empty state when images is undefined", () => {
    render(<Gallery images={undefined as any} />);
    expect(screen.getByText("No images")).toBeInTheDocument();
  });

  it("renders image gallery with multiple images", () => {
    render(<Gallery images={mockImages} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(5);
  });

  it("navigates to next image when next button is clicked", () => {
    const { container } = render(<Gallery images={mockImages} />);
    const nextButton = screen.getByLabelText("next");
    fireEvent.click(nextButton);
    const thumbnails = container.querySelectorAll(".ring-2");
    expect(thumbnails.length).toBeGreaterThan(0);
  });

  it("navigates to previous image when prev button is clicked", () => {
    render(<Gallery images={mockImages} />);
    const prevButton = screen.getByLabelText("previous");
    const nextButton = screen.getByLabelText("next");
    fireEvent.click(nextButton);
    fireEvent.click(prevButton);
    expect(prevButton).toBeInTheDocument();
  });

  it("cycles to next image after reaching the end", () => {
    render(<Gallery images={mockImages} />);
    const nextButton = screen.getByLabelText("next");
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);
    expect(nextButton).toBeInTheDocument();
  });

  it("cycles to previous image from first image", () => {
    render(<Gallery images={mockImages} />);
    const prevButton = screen.getByLabelText("previous");
    fireEvent.click(prevButton);
    expect(prevButton).toBeInTheDocument();
  });

  it("selects thumbnail when clicked", () => {
    render(<Gallery images={mockImages} />);
    const buttons = screen.getAllByRole("button");
    const secondThumbnail = buttons[2];
    fireEvent.click(secondThumbnail);
    expect(secondThumbnail.className).toContain("ring-2");
  });

  it("normalizes minio image URLs correctly", () => {
    const minioImages = [
      { imageUrl: "http://minio:9000/bucket/image.jpg" },
    ];
    render(<Gallery images={minioImages} />);
    expect(screen.queryByText("No images")).not.toBeInTheDocument();
  });

  it("handles malformed URLs gracefully", () => {
    const badImages = [
      { imageUrl: "not-a-url" },
      { imageUrl: "http://example.com/valid.jpg" },
    ];
    render(<Gallery images={badImages} />);
    expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
  });

  it("handles undefined imageUrl in array", () => {
    const mixedImages = [
      { imageUrl: "http://example.com/image1.jpg" },
      { imageUrl: undefined },
      { imageUrl: "http://example.com/image3.jpg" },
    ];
    render(<Gallery images={mixedImages} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(5);
  });

  it("renders with zero images", () => {
    const emptyImages: any[] = [];
    render(<Gallery images={emptyImages} />);
    expect(screen.getByText("No images")).toBeInTheDocument();
  });

  it("handles single image correctly", () => {
    const singleImage = [{ imageUrl: "http://example.com/single.jpg" }];
    render(<Gallery images={singleImage} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(3);
  });

  it("resets index to 0 when images array changes to shorter length", () => {
    const { rerender } = render(<Gallery images={mockImages} />);
    const nextButton = screen.getByLabelText("next");
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);
    rerender(<Gallery images={[mockImages[0]]} />);
    expect(screen.getAllByRole("button").length).toBe(3);
  });
});
