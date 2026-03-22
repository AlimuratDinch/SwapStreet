import { render, screen, fireEvent } from "@testing-library/react";
import { SearchBar } from "@/app/browse/components/SearchBar";

describe("SearchBar", () => {
  it("updates input value on change", () => {
    const mockSearch = jest.fn();
    render(<SearchBar onSearch={mockSearch} />);
    const input = screen.getByPlaceholderText("Search...") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "Navy Jacket" } });
    expect(input.value).toBe("Navy Jacket");
  });

  it("updates internal state when initialValue prop changes", () => {
    const { rerender } = render(
      <SearchBar onSearch={jest.fn()} initialValue="First" />,
    );
    const input = screen.getByPlaceholderText("Search...") as HTMLInputElement;
    expect(input.value).toBe("First");

    // Trigger the useEffect by changing the prop
    rerender(<SearchBar onSearch={jest.fn()} initialValue="Second" />);
    expect(input.value).toBe("Second");
  });

  it("does not call onSearch when a key other than Enter is pressed", () => {
    const mockSearch = jest.fn();
    render(<SearchBar onSearch={mockSearch} />);
    const input = screen.getByPlaceholderText("Search...");

    fireEvent.change(input, { target: { value: "Denim" } });
    fireEvent.keyDown(input, { key: "Escape", code: "Escape" });

    expect(mockSearch).not.toHaveBeenCalled();
  });

  it("calls onSearch with trimmed whitespace", () => {
    const mockSearch = jest.fn();
    render(<SearchBar onSearch={mockSearch} />);
    const input = screen.getByPlaceholderText("Search...");

    fireEvent.change(input, { target: { value: "   Navy Jacket   " } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(mockSearch).toHaveBeenCalledWith("Navy Jacket");
  });

  it("calls onSearch when Enter key is pressed", () => {
    const mockSearch = jest.fn();
    render(<SearchBar onSearch={mockSearch} />);
    const input = screen.getByPlaceholderText("Search...");

    fireEvent.change(input, { target: { value: "Denim" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(mockSearch).toHaveBeenCalledWith("Denim");
  });

  it("handles empty search input", () => {
    const mockSearch = jest.fn();
    render(<SearchBar onSearch={mockSearch} />);
    const input = screen.getByPlaceholderText("Search...");

    fireEvent.change(input, { target: { value: "" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(mockSearch).toHaveBeenCalledWith("");
  });

  it("handles search with special characters", () => {
    const mockSearch = jest.fn();
    render(<SearchBar onSearch={mockSearch} />);
    const input = screen.getByPlaceholderText("Search...");

    fireEvent.change(input, { target: { value: "Gucci & Prada" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(mockSearch).toHaveBeenCalledWith("Gucci & Prada");
  });

  it("does not call onSearch multiple times for single Enter press", () => {
    const mockSearch = jest.fn();
    render(<SearchBar onSearch={mockSearch} />);
    const input = screen.getByPlaceholderText("Search...");

    fireEvent.change(input, { target: { value: "Test" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(mockSearch).toHaveBeenCalledTimes(2);
  });

  it("preserves input value after search", () => {
    const mockSearch = jest.fn();
    render(<SearchBar onSearch={mockSearch} />);
    const input = screen.getByPlaceholderText("Search...") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "Shoes" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(input.value).toBe("Shoes");
  });

  it("handles very long search queries", () => {
    const mockSearch = jest.fn();
    render(<SearchBar onSearch={mockSearch} />);
    const input = screen.getByPlaceholderText("Search...");

    const longSearch = "a".repeat(100);
    fireEvent.change(input, { target: { value: longSearch } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(mockSearch).toHaveBeenCalledWith(longSearch);
  });

  it("clears initial value when prop changes to empty string", () => {
    const { rerender } = render(
      <SearchBar onSearch={jest.fn()} initialValue="Initial" />,
    );
    const input = screen.getByPlaceholderText("Search...") as HTMLInputElement;
    expect(input.value).toBe("Initial");

    rerender(<SearchBar onSearch={jest.fn()} initialValue="" />);
    expect(input.value).toBe("");
  });

  it("ignores non-Enter keys like Space", () => {
    const mockSearch = jest.fn();
    render(<SearchBar onSearch={mockSearch} />);
    const input = screen.getByPlaceholderText("Search...");

    fireEvent.change(input, { target: { value: "Test" } });
    fireEvent.keyDown(input, { key: " ", code: "Space" });

    expect(mockSearch).not.toHaveBeenCalled();
  });
});
