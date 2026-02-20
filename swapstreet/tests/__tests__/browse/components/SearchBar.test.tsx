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
});
