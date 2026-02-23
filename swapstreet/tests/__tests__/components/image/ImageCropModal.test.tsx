import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ImageCropModal from "@/components/image/ImageCropModal";

jest.mock("@/components/common/logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockArea = { x: 0, y: 0, width: 100, height: 100 };

jest.mock("react-easy-crop", () => ({
  __esModule: true,
  default: function MockCropper({
    onCropComplete,
    onCropAreaChange,
  }: {
    onCropComplete?: (
      _: unknown,
      pixels: { x: number; y: number; width: number; height: number },
    ) => void;
    onCropAreaChange?: (
      _: unknown,
      pixels: { x: number; y: number; width: number; height: number },
    ) => void;
  }) {
    React.useEffect(() => {
      onCropComplete?.(null, mockArea);
      onCropAreaChange?.(null, mockArea);
    }, [onCropComplete, onCropAreaChange]);
    return <div data-testid="cropper-mock">Cropper</div>;
  },
}));

// Resolve dynamic import synchronously so Cropper mock mounts and sets crop area
jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: (
    _loader: () => Promise<{ default: React.ComponentType<unknown> }>,
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Jest mock needs sync module resolution
    const Mod = require("react-easy-crop").default;
    return function DynamicWrapper(props: Record<string, unknown>) {
      return React.createElement(Mod, props);
    };
  },
}));

describe("ImageCropModal", () => {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();
  const onError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Image so getCroppedImg can load the "image"
    global.Image = class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      crossOrigin = "";
      src = "";
      constructor() {
        setTimeout(() => this.onload?.(), 0);
      }
    } as unknown as typeof Image;
    // Mock canvas.getContext and toBlob so getCroppedImg resolves
    const mockDrawImage = jest.fn();
    HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
      drawImage: mockDrawImage,
    });
    HTMLCanvasElement.prototype.toBlob = function (
      callback: (blob: Blob | null) => void,
    ) {
      callback(new Blob(["mock"], { type: "image/jpeg" }));
    };
  });

  it("renders nothing when open is false", () => {
    const { container } = render(
      <ImageCropModal
        open={false}
        imageUrl="blob:test"
        aspect={1}
        cropShape="round"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when imageUrl is empty and open is true", () => {
    const { container } = render(
      <ImageCropModal
        open={true}
        imageUrl=""
        aspect={1}
        cropShape="round"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders modal with Cancel and Apply when open and imageUrl set", async () => {
    render(
      <ImageCropModal
        open={true}
        imageUrl="blob:test"
        aspect={1}
        cropShape="round"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /cancel/i }),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /apply crop/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("cropper-mock")).toBeInTheDocument();
  });

  it("calls onCancel when Cancel is clicked", async () => {
    render(
      <ImageCropModal
        open={true}
        imageUrl="blob:test"
        aspect={1}
        cropShape="round"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /cancel/i }),
      ).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("calls onConfirm with a File when Apply crop is clicked after crop area is set", async () => {
    render(
      <ImageCropModal
        open={true}
        imageUrl="blob:test"
        aspect={1}
        cropShape="round"
        onConfirm={onConfirm}
        onCancel={onCancel}
        sourceFileName="avatar"
      />,
    );
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /apply crop/i }),
      ).toBeInTheDocument();
    });
    // Mock cropper sets crop area in useEffect; wait for Apply to become enabled
    await waitFor(
      () => {
        const applyBtn = screen.getByRole("button", { name: /apply crop/i });
        expect(applyBtn).not.toBeDisabled();
      },
      { timeout: 500 },
    );
    fireEvent.click(screen.getByRole("button", { name: /apply crop/i }));
    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledTimes(1);
      const file = onConfirm.mock.calls[0][0];
      expect(file).toBeInstanceOf(File);
      expect(file.name).toBe("avatar.jpg");
      expect(file.type).toBe("image/jpeg");
    });
  });

  it("calls onError when crop fails", async () => {
    HTMLCanvasElement.prototype.toBlob = function (
      callback: (blob: Blob | null) => void,
    ) {
      callback(null);
    };
    render(
      <ImageCropModal
        open={true}
        imageUrl="blob:test"
        aspect={1}
        cropShape="round"
        onConfirm={onConfirm}
        onCancel={onCancel}
        onError={onError}
      />,
    );
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /apply crop/i }),
      ).toBeInTheDocument();
    });
    await waitFor(
      () => {
        const applyBtn = screen.getByRole("button", { name: /apply crop/i });
        expect(applyBtn).not.toBeDisabled();
      },
      { timeout: 500 },
    );
    fireEvent.click(screen.getByRole("button", { name: /apply crop/i }));
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        "Failed to crop image. Please try another image.",
      );
    });
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
