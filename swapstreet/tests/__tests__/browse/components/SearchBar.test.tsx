import { render, screen, fireEvent } from "@testing-library/react";
import { SearchBar } from "../../../../app/browse/components/SearchBar";

describe("SearchBar", () => {
  it("updates input value on change", () => {
    const mockSearch = jest.fn();
    render(<SearchBar onSearch={mockSearch} />);
    const input = screen.getByPlaceholderText("Search...") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "Navy Jacket" } });
    expect(input.value).toBe("Navy Jacket");
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
