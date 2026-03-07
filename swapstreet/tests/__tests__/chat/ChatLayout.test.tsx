"use client";
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import ChatLayout from "@/app/chat/ChatLayout";

// ──────────────────── Mocks ────────────────────

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: () => null }),
  useParams: () => ({ id: "room-1" }),
}));

jest.mock("@/components/common/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// SignalR mock
const mockInvoke = jest.fn().mockResolvedValue(undefined);
const mockOn = jest.fn();
const mockStart = jest.fn().mockResolvedValue(undefined);
const mockStop = jest.fn().mockResolvedValue(undefined);

const mockConnection = {
  on: mockOn,
  start: mockStart,
  stop: mockStop,
  invoke: mockInvoke,
};

const mockBuild = jest.fn().mockReturnValue(mockConnection);

jest.mock("@microsoft/signalr", () => ({
  HubConnectionBuilder: jest.fn().mockImplementation(() => ({
    withUrl: jest.fn().mockReturnThis(),
    withAutomaticReconnect: jest.fn().mockReturnThis(),
    build: mockBuild,
  })),
}), { virtual: true });

// Auth mock
let mockAuthState = {
  userId: "user-123",
  accessToken: "fake-token",
  isAuthenticated: true,
  authLoaded: true,
  refreshToken: jest.fn(),
};

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuthState,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Chat context mock
let mockUnread: Record<string, unknown> = {};
const mockMarkAsRead = jest.fn();
const mockLatestMessages: Record<string, string> = {};

jest.mock("@/contexts/ChatContext", () => ({
  useChatContext: () => ({
    unread: mockUnread,
    latestMessages: mockLatestMessages,
    markAsRead: mockMarkAsRead,
  }),
}));

// ──────────────────── Helpers ────────────────────

const mockChatrooms = [
  {
    id: "room-1",
    sellerId: "seller-abc",
    buyerId: "user-123",
    messages: [
      {
        id: "m1",
        content: "Hello!",
        author: "seller-abc",
        chatroomId: "room-1",
        sendDate: "2026-01-01T10:00:00Z",
      },
    ],
  },
  {
    id: "room-2",
    sellerId: "user-123",
    buyerId: "buyer-xyz",
    messages: [],
  },
];

const mockMessages = [
  {
    id: "m1",
    content: "Hello!",
    author: "seller-abc",
    chatroomId: "room-1",
    sendDate: "2026-01-01T10:00:00Z",
  },
  {
    id: "m2",
    content: "Hi there",
    author: "user-123",
    chatroomId: "room-1",
    sendDate: "2026-01-01T10:01:00Z",
  },
];

function setupFetch(
  chatrooms = mockChatrooms,
  messages = mockMessages,
  profile = { firstName: "Alice", lastName: "Smith", profileImagePath: null },
) {
  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    if (url === "/api/chat/chatrooms") {
      return Promise.resolve({ ok: true, json: async () => chatrooms });
    }
    if (url.includes("/messages")) {
      return Promise.resolve({ ok: true, json: async () => messages });
    }
    if (url.includes("/api/profile/")) {
      return Promise.resolve({ ok: true, json: async () => profile });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });
}

// ──────────────────── Tests ────────────────────

describe("ChatLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUnread = {};
    mockAuthState = {
      userId: "user-123",
      accessToken: "fake-token",
      isAuthenticated: true,
      authLoaded: true,
      refreshToken: jest.fn(),
    };
    global.fetch = jest.fn();
    setupFetch();
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  // ──────────────────── Authentication ────────────────────

  it("returns null while auth is loading", () => {
    mockAuthState = {
      ...mockAuthState,
      authLoaded: false,
      isAuthenticated: false,
    };
    const { container } = render(<ChatLayout activeChatroomId={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("redirects to sign-in when unauthenticated", async () => {
    mockAuthState = {
      ...mockAuthState,
      authLoaded: true,
      isAuthenticated: false,
    };
    render(<ChatLayout activeChatroomId={null} />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/auth/sign-in");
    });
  });

  // ──────────────────── Empty state ────────────────────

  it("shows empty state when no active chatroom is selected", async () => {
    render(<ChatLayout activeChatroomId={null} />);
    await waitFor(() => {
      expect(screen.getByText(/select a conversation/i)).toBeInTheDocument();
    });
  });

  it("shows 'No conversations yet.' when chatrooms list is empty", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    render(<ChatLayout activeChatroomId={null} />);
    await waitFor(() => {
      expect(screen.getByText(/no conversations yet/i)).toBeInTheDocument();
    });
  });

  // ──────────────────── Sidebar ────────────────────

  it("fetches chatrooms on mount using the access token", async () => {
    render(<ChatLayout activeChatroomId={null} />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/chat/chatrooms", {
        headers: { Authorization: "Bearer fake-token" },
      });
    });
  });

  it("renders 'Messages' heading in the sidebar", async () => {
    render(<ChatLayout activeChatroomId={null} />);
    await waitFor(() => {
      expect(screen.getByText("Messages")).toBeInTheDocument();
    });
  });

  it("resolves and displays the other user's name in the sidebar", async () => {
    render(<ChatLayout activeChatroomId={null} />);
    await waitFor(() => {
      expect(screen.getAllByText("Alice Smith").length).toBeGreaterThan(0);
    });
  });

  it("shows the last message preview in the sidebar", async () => {
    render(<ChatLayout activeChatroomId={null} />);
    await waitFor(() => {
      expect(screen.getByText("Hello!")).toBeInTheDocument();
    });
  });

  it("shows an unread dot for rooms with unread messages", async () => {
    mockUnread = {
      "room-1": {
        chatroomId: "room-1",
        senderName: "Alice",
        content: "Hey",
        sendDate: "",
        senderImage: null,
      },
    };
    const { container } = render(<ChatLayout activeChatroomId={null} />);
    await waitFor(() => {
      const dot = container.querySelector(".bg-teal-500.rounded-full");
      expect(dot).toBeInTheDocument();
    });
  });

  it("navigates to the chatroom when a sidebar item is clicked", async () => {
    render(<ChatLayout activeChatroomId={null} />);
    await waitFor(() => {
      expect(screen.getByText("Messages")).toBeInTheDocument();
    });
    const chatroomButtons = screen.getAllByRole("button");
    fireEvent.click(chatroomButtons[0]);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/chat/room-1");
    });
  });

  it("highlights the active chatroom in the sidebar", async () => {
    setupFetch();
    render(<ChatLayout activeChatroomId="room-1" />);
    await waitFor(() => {
      expect(screen.getByText("Messages")).toBeInTheDocument();
    });
    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toHaveClass("bg-gray-200");
  });

  // ──────────────────── ChatPanel ────────────────────

  it("renders the chat panel when an active chatroom is selected", async () => {
    render(<ChatLayout activeChatroomId="room-1" />);
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/type message here/i),
      ).toBeInTheDocument();
    });
  });

  it("fetches message history for the active chatroom", async () => {
    render(<ChatLayout activeChatroomId="room-1" />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/chat/chatrooms/room-1/messages",
        expect.objectContaining({
          headers: { Authorization: "Bearer fake-token" },
        }),
      );
    });
  });

  it("displays loaded messages in the chat panel", async () => {
    render(<ChatLayout activeChatroomId="room-1" />);
    await waitFor(() => {
      expect(screen.getByText("Hi there")).toBeInTheDocument();
    });
  });

  it("send button is disabled when the input is empty", async () => {
    render(<ChatLayout activeChatroomId="room-1" />);
    await waitFor(() => {
      expect(screen.getByTitle("Send")).toBeDisabled();
    });
  });

  it("send button is enabled once input has text and connection is established", async () => {
    render(<ChatLayout activeChatroomId="room-1" />);

    // Wait for SignalR start
    await waitFor(() => expect(mockStart).toHaveBeenCalled());

    const textarea = screen.getByPlaceholderText(/type message here/i);
    await act(async () => {
      fireEvent.change(textarea, { target: { value: "Hello" } });
    });

    await waitFor(() => {
      expect(screen.getByTitle("Send")).not.toBeDisabled();
    });
  });

  it("does not send when Enter+Shift is pressed", async () => {
    render(<ChatLayout activeChatroomId="room-1" />);
    await waitFor(() => expect(mockStart).toHaveBeenCalled());

    const textarea = screen.getByPlaceholderText(/type message here/i);
    await act(async () => {
      fireEvent.change(textarea, { target: { value: "Draft" } });
      fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    });

    expect(mockInvoke).not.toHaveBeenCalledWith("room-1", "Draft");
  });

  it("marks the chatroom as read when ChatPanel mounts", async () => {
    render(<ChatLayout activeChatroomId="room-1" />);
    await waitFor(() => {
      expect(mockMarkAsRead).toHaveBeenCalledWith("room-1");
    });
  });

  it("redirects to sign-in from ChatPanel when unauthenticated", async () => {
    mockAuthState = {
      ...mockAuthState,
      authLoaded: true,
      isAuthenticated: false,
    };
    render(<ChatLayout activeChatroomId="room-1" />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/auth/sign-in");
    });
  });
});
