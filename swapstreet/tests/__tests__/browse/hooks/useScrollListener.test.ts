import { renderHook } from "@testing-library/react";
import { useScrollListener } from "@/app/browse/hooks/useScrollListener";

describe("useScrollListener hook", () => {
  let mockContainer: HTMLDivElement;
  const mockCallback = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Create a mock scrollable element
    mockContainer = document.createElement("div");

    // Set up dimensions to simulate a scrollable area
    // scrollHeight (1000) > clientHeight (500)
    Object.defineProperty(mockContainer, "scrollHeight", {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(mockContainer, "clientHeight", {
      value: 500,
      configurable: true,
    });
    Object.defineProperty(mockContainer, "scrollTop", {
      value: 0,
      writable: true,
      configurable: true,
    });

    // Mock addEventListener/removeEventListener
    mockContainer.addEventListener = jest.fn();
    mockContainer.removeEventListener = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("does nothing if the container ref is null", () => {
    const nullRef = { current: null };
    renderHook(() => useScrollListener(nullRef, mockCallback, true));

    // The hook should exit the useEffect early and not crash
    expect(mockCallback).not.toHaveBeenCalled();
  });

  it("exits handleScroll early if ref becomes null after mounting", () => {
    const ref = { current: mockContainer as HTMLElement | null };
    renderHook(() => useScrollListener(ref, mockCallback, true));

    const scrollHandler = (mockContainer.addEventListener as jest.Mock).mock
      .calls[0][1];

    // Manually nullify the ref after mounting
    ref.current = null;

    // Trigger handler
    scrollHandler();

    expect(mockCallback).not.toHaveBeenCalled();
  });
  it("does not call callback if user has not reached the threshold", () => {
    renderHook(() =>
      useScrollListener({ current: mockContainer }, mockCallback, true),
    );

    const scrollHandler = (mockContainer.addEventListener as jest.Mock).mock
      .calls[0][1];

    // Scroll math: scrollTop (300) + clientHeight (500) = 800
    // Threshold: scrollHeight (1000) - 100 = 900
    // 800 is NOT >= 900
    mockContainer.scrollTop = 300;
    scrollHandler();

    expect(mockCallback).not.toHaveBeenCalled();
  });
  it("triggers exactly at the threshold boundary", () => {
    renderHook(() =>
      useScrollListener({ current: mockContainer }, mockCallback, true),
    );
    const scrollHandler = (mockContainer.addEventListener as jest.Mock).mock
      .calls[0][1];

    // 1px before threshold (899 < 900)
    mockContainer.scrollTop = 399;
    scrollHandler();
    expect(mockCallback).not.toHaveBeenCalled();

    // Exactly at threshold (900 >= 900)
    mockContainer.scrollTop = 400;
    scrollHandler();
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it("attaches scroll listener on mount and detaches on unmount", () => {
    const { unmount } = renderHook(() =>
      useScrollListener({ current: mockContainer }, mockCallback, true),
    );

    expect(mockContainer.addEventListener).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function),
    );

    unmount();
    expect(mockContainer.removeEventListener).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function),
    );
  });

  it("does not call callback when isEnabled is false", () => {
    renderHook(() =>
      useScrollListener({ current: mockContainer }, mockCallback, false),
    );

    // Get the actual listener function passed to addEventListener
    const scrollHandler = (mockContainer.addEventListener as jest.Mock).mock
      .calls[0][1];

    // Scroll to the bottom
    mockContainer.scrollTop = 500; // 500 + 500 >= 1000 - 100
    scrollHandler();

    expect(mockCallback).not.toHaveBeenCalled();
  });

  it("calls callback when user scrolls to the bottom threshold", () => {
    renderHook(() =>
      useScrollListener({ current: mockContainer }, mockCallback, true),
    );

    const scrollHandler = (mockContainer.addEventListener as jest.Mock).mock
      .calls[0][1];

    // Simulate scrolling near the bottom (100px threshold)
    mockContainer.scrollTop = 450; // 450 + 500 = 950. Threshold is 900.
    scrollHandler();

    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it("throttles multiple scroll events within 500ms", () => {
    renderHook(() =>
      useScrollListener({ current: mockContainer }, mockCallback, true),
    );

    const scrollHandler = (mockContainer.addEventListener as jest.Mock).mock
      .calls[0][1];

    // First scroll
    mockContainer.scrollTop = 500;
    scrollHandler();

    // Immediate second scroll
    scrollHandler();

    expect(mockCallback).toHaveBeenCalledTimes(1);

    // Advance time by 600ms
    jest.advanceTimersByTime(600);

    // Third scroll after throttle period
    scrollHandler();
    expect(mockCallback).toHaveBeenCalledTimes(2);
  });

  it("updates the listener when callback or isEnabled changes", () => {
    const { rerender } = renderHook(
      ({ enabled }) =>
        useScrollListener({ current: mockContainer }, mockCallback, enabled),
      { initialProps: { enabled: true } },
    );

    // Re-rendering with new props should trigger cleanup and re-attach
    rerender({ enabled: false });

    // Check that removeEventListener was called for the old handler
    expect(mockContainer.removeEventListener).toHaveBeenCalled();
    // Check that addEventListener was called for the new state
    expect(mockContainer.addEventListener).toHaveBeenCalledTimes(2);
  });
});
