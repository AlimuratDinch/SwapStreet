import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// ──────────────────── Mocks ────────────────────

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useParams: () => ({ id: "room-42" }),
  useSearchParams: () => ({ get: () => null }),
}));

jest.mock("@/components/common/Header", () => ({
  Header: () => <header data-testid="header" />,
}));

jest.mock("@/app/chat/ChatLayout", () =>
  function MockChatLayout({ activeChatroomId }: { activeChatroomId: string | null }) {
    return <div data-testid="chat-layout" data-active={activeChatroomId ?? "null"} />;
  }
);

// ──────────────────── ChatIndexPage ────────────────────

describe("ChatIndexPage (app/chat/page.tsx)", () => {
  let ChatIndexPage: React.ComponentType;

  beforeEach(async () => {
    jest.resetModules();
    const mod = await import("@/app/chat/page");
    ChatIndexPage = mod.default;
  });

  it("renders the Header", () => {
    render(<ChatIndexPage />);
    expect(screen.getByTestId("header")).toBeInTheDocument();
  });

  it("renders ChatLayout with activeChatroomId=null", () => {
    render(<ChatIndexPage />);
    const layout = screen.getByTestId("chat-layout");
    expect(layout).toBeInTheDocument();
    expect(layout).toHaveAttribute("data-active", "null");
  });
});

// ──────────────────── ChatPage ────────────────────

describe("ChatPage (app/chat/[id]/page.tsx)", () => {
  let ChatPage: React.ComponentType;

  beforeEach(async () => {
    jest.resetModules();
    const mod = await import("@/app/chat/[id]/page");
    ChatPage = mod.default;
  });

  it("renders the Header", () => {
    render(<ChatPage />);
    expect(screen.getByTestId("header")).toBeInTheDocument();
  });

  it("renders ChatLayout with the chatroomId from useParams", () => {
    render(<ChatPage />);
    const layout = screen.getByTestId("chat-layout");
    expect(layout).toBeInTheDocument();
    expect(layout).toHaveAttribute("data-active", "room-42");
  });
});
