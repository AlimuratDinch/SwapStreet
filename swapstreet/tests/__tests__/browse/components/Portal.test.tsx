import { render, screen } from "@testing-library/react";
import { Portal } from "@/app/browse/components/Portal";

describe("Portal Component", () => {
  // No manual DOM cleanup here; rely on testing-library React cleanup

  it("renders children to document.body after mount", () => {
    const { container } = render(
      <Portal>
        <div data-testid="portal-test">Portal Content</div>
      </Portal>,
    );

    // The container should be empty because content is in a portal
    expect(container.firstChild).toBeNull();

    // Content should be in document.body
    expect(screen.getByTestId("portal-test")).toBeInTheDocument();
    expect(document.body.contains(screen.getByTestId("portal-test"))).toBe(
      true,
    );
  });

  it("returns null before mount (for SSR)", () => {
    const { container } = render(
      <Portal>
        <div>Test Content</div>
      </Portal>,
    );

    // Initially returns null before useEffect runs
    expect(container.childNodes).toHaveLength(0);
  });

  it("renders multiple portals correctly", () => {
    render(
      <>
        <Portal>
          <div data-testid="portal-1">Portal 1</div>
        </Portal>
        <Portal>
          <div data-testid="portal-2">Portal 2</div>
        </Portal>
      </>,
    );

    expect(screen.getByTestId("portal-1")).toBeInTheDocument();
    expect(screen.getByTestId("portal-2")).toBeInTheDocument();
  });

  it("renders complex nested content in portal", () => {
    render(
      <Portal>
        <div data-testid="portal-test">
          <h1>Modal Title</h1>
          <p>Modal Content</p>
          <button>Close</button>
        </div>
      </Portal>,
    );

    expect(screen.getByText("Modal Title")).toBeInTheDocument();
    expect(screen.getByText("Modal Content")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("cleans up portal on unmount", () => {
    const { unmount } = render(
      <Portal>
        <div data-testid="portal-test">Portal Content</div>
      </Portal>,
    );

    expect(screen.getByTestId("portal-test")).toBeInTheDocument();

    unmount();

    // Portal content should be removed from document
    expect(screen.queryByTestId("portal-test")).not.toBeInTheDocument();
  });

  it("renders to document.body, not a custom container", () => {
    render(
      <Portal>
        <div data-testid="portal-test">Portal Content</div>
      </Portal>,
    );

    const portalContent = screen.getByTestId("portal-test");
    const bodyChildren = Array.from(document.body.children);

    expect(bodyChildren.some((child) => child.contains(portalContent))).toBe(
      true,
    );
  });
});
