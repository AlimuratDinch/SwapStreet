import { render, screen } from "@testing-library/react";

jest.mock("@/app/chat/ChatLayout.module.css", () => ({
  avatar: "avatar-class",
}));

import Avatar from "@/app/chat/components/Avatar";

describe("Avatar Component", () => {
  const getImg = () =>
    document.querySelector("img") as HTMLImageElement | null;

  it("renders with provided src", () => {
    render(<Avatar src="http://example.com/avatar.jpg" />);

    const img = getImg();
    expect(img).toHaveAttribute("src", "http://example.com/avatar.jpg");
  });

  it("renders with default avatar when src is not provided", () => {
    render(<Avatar />);

    const img = getImg();
    expect(img).toHaveAttribute("src", "/images/default-avatar-icon.jpg");
  });

  it("renders with default avatar when src is null", () => {
    render(<Avatar src={null} />);

    const img = getImg();
    expect(img).toHaveAttribute("src", "/images/default-avatar-icon.jpg");
  });

  it("renders with default avatar when src is undefined", () => {
    render(<Avatar src={undefined} />);

    const img = getImg();
    expect(img).toHaveAttribute("src", "/images/default-avatar-icon.jpg");
  });

  it("applies avatar CSS class", () => {
    render(<Avatar src="http://example.com/avatar.jpg" />);

    const img = getImg();
    expect(img).toHaveClass("avatar-class");
  });

  it("applies custom className when provided", () => {
    render(
      <Avatar src="http://example.com/avatar.jpg" className="custom-class" />,
    );

    const img = getImg();
    expect(img).toHaveClass("custom-class");
  });

  it("applies both avatar class and custom className", () => {
    render(
      <Avatar
        src="http://example.com/avatar.jpg"
        className="custom-class another-class"
      />,
    );

    const img = getImg();
    expect(img!.className).toContain("avatar-class");
    expect(img!.className).toContain("custom-class");
    expect(img!.className).toContain("another-class");
  });

  it("sets correct width style with default size", () => {
    render(<Avatar />);

    const img = getImg();
    expect(img).toHaveStyle({ width: "2.5rem", height: "2.5rem" });
  });

  it("sets correct width style with custom size", () => {
    render(<Avatar size={20} />);

    const img = getImg();
    expect(img).toHaveStyle({ width: "5rem", height: "5rem" });
  });

  it("converts size to rem correctly", () => {
    render(<Avatar size={8} />);

    const img = getImg();
    expect(img).toHaveStyle({ width: "2rem", height: "2rem" });
  });

  it("handles size of 1", () => {
    render(<Avatar size={1} />);

    const img = getImg();
    expect(img).toHaveStyle({ width: "0.25rem", height: "0.25rem" });
  });

  it("handles large size values", () => {
    render(<Avatar size={100} />);

    const img = getImg();
    expect(img).toHaveStyle({ width: "25rem", height: "25rem" });
  });

  it("maintains square aspect ratio", () => {
    render(<Avatar size={15} />);

    const img = getImg();
    const width = img!.style.width;
    const height = img!.style.height;
    expect(width).toBe(height);
  });

  it("has empty alt text for accessibility", () => {
    render(<Avatar src="http://example.com/avatar.jpg" />);

    const img = getImg();
    expect(img).toHaveAttribute("alt", "");
  });

  it("handles empty string src", () => {
    render(<Avatar src="" />);

    const img = getImg();
    expect(img).toHaveAttribute("src", "/images/default-avatar-icon.jpg");
  });

  it("handles whitespace src", () => {
    render(<Avatar src="   " />);

    const img = getImg();
    expect(img).toHaveAttribute("src", "   ");
  });

  it("filters out false className values", () => {
    render(<Avatar src="http://example.com/avatar.jpg" className="" />);

    const img = getImg();
    const classNames = img!.className.split(" ");
    expect(classNames).not.toContain("");
  });

  it("preserves className order", () => {
    render(
      <Avatar src="http://example.com/avatar.jpg" className="first second" />,
    );

    const img = getImg();
    expect(img!.className).toMatch(/avatar-class.*first.*second/);
  });
});
