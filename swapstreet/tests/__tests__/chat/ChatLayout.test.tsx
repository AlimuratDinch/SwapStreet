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
import * as signalR from "@microsoft/signalr";
import ChatLayout from "@/app/chat/ChatLayout";

// Mocks

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

jest.mock("@microsoft/signalr");

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

const mockChatrooms = [
  {
    id: "room-1",
    sellerId: "seller-abc",
    buyerId: "user-123",
    isArchived: false,
    isFrozen: false,
    isDealClosed: false,
    closeRequestedById: null,
    closeConfirmedBySeller: false,
    closeConfirmedByBuyer: false,
    ratings: [],
    listingId: "listing-1",
    listingTitle: "Test Item",
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
    isArchived: false,
    isFrozen: false,
    isDealClosed: false,
    closeRequestedById: null,
    closeConfirmedBySeller: false,
    closeConfirmedByBuyer: false,
    ratings: [],
    listingId: "listing-2",
    listingTitle: "Another Item",
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
    if (url.includes("/api/search/listing/")) {
      return Promise.resolve({ ok: true, json: async () => ({ images: [] }) });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });
}

function makeSellerRoom(overrides = {}) {
  return {
    ...mockChatrooms[0],
    sellerId: "seller-abc",
    buyerId: "buyer-xyz",
    isArchived: false,
    isFrozen: false,
    isDealClosed: false,
    closeRequestedById: null,
    listingId: "listing-1",
    listingTitle: "Test Item",
    ratings: [],
    ...overrides,
  };
}

// Tests

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

    (signalR.HubConnectionBuilder as jest.Mock).mockImplementation(() => ({
      withUrl: jest.fn().mockReturnThis(),
      withAutomaticReconnect: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue(mockConnection),
    }));
  });

  // Authentication

  it("returns null while auth is loading", () => {
    // Arrange
    mockAuthState = {
      ...mockAuthState,
      authLoaded: false,
      isAuthenticated: false,
    };

    // Act
    const { container } = render(<ChatLayout activeChatroomId={null} />);

    // Assert
    expect(container.firstChild).toBeNull();
  });

  it("redirects to sign-in when unauthenticated", async () => {
    // Arrange
    mockAuthState = {
      ...mockAuthState,
      authLoaded: true,
      isAuthenticated: false,
    };

    // Act
    render(<ChatLayout activeChatroomId={null} />);

    // Assert
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/auth/sign-in");
    });
  });

  // Empty state

  it("shows empty state when no active chatroom is selected", async () => {
    // Arrange + Act
    render(<ChatLayout activeChatroomId={null} />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/select a conversation/i)).toBeInTheDocument();
    });
  });

  it("shows 'No conversations yet.' when chatrooms list is empty", async () => {
    // Arrange
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    // Act
    render(<ChatLayout activeChatroomId={null} />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/no conversations yet/i)).toBeInTheDocument();
    });
  });

  // Sidebar

  it("fetches chatrooms on mount using the access token", async () => {
    // Arrange + Act
    render(<ChatLayout activeChatroomId={null} />);

    // Assert
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/chat/chatrooms", {
        headers: { Authorization: "Bearer fake-token" },
      });
    });
  });

  it("renders 'Messages' heading in the sidebar", async () => {
    // Arrange + Act
    render(<ChatLayout activeChatroomId={null} />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText("Messages")).toBeInTheDocument();
    });
  });

  it("resolves and displays the other user's name in the sidebar", async () => {
    // Arrange + Act
    render(<ChatLayout activeChatroomId={null} />);

    // Assert
    await waitFor(() => {
      expect(screen.getAllByText("Alice Smith").length).toBeGreaterThan(0);
    });
  });

  it("shows the last message preview in the sidebar", async () => {
    // Arrange + Act
    render(<ChatLayout activeChatroomId={null} />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText("Hello!")).toBeInTheDocument();
    });
  });

  // Chat header — rating display

  it("shows the seller's rating average in the chat header when current user is the buyer", async () => {
    // Arrange – room has a seller rating, current user is the buyer
    const ratedRoom = {
      ...mockChatrooms[0],
      sellerRatingAverage: 4.5,
      sellerRatingCount: 10,
    };
    setupFetch([ratedRoom], mockMessages);

    // Act
    render(<ChatLayout activeChatroomId="room-1" />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText("4.5")).toBeInTheDocument();
    });
  });

  it("shows the buyer's rating average in the chat header when current user is the seller", async () => {
    // Arrange
    mockAuthState = { ...mockAuthState, userId: "seller-abc" };
    const ratedRoom = {
      ...mockChatrooms[0],
      sellerId: "seller-abc",
      buyerId: "user-123",
      buyerRatingAverage: 3.8,
      buyerRatingCount: 5,
    };
    setupFetch([ratedRoom], mockMessages);

    // Act
    render(<ChatLayout activeChatroomId="room-1" />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText("3.8")).toBeInTheDocument();
    });
  });

  it("shows 'No ratings' in the chat header when the other user has no ratings", async () => {
    // Arrange
    const unratedRoom = {
      ...mockChatrooms[0],
      sellerRatingAverage: null,
      sellerRatingCount: 0,
    };
    setupFetch([unratedRoom], mockMessages);

    // Act
    render(<ChatLayout activeChatroomId="room-1" />);

    // Assert
    await waitFor(() => {
      expect(screen.getAllByText("No ratings").length).toBeGreaterThan(0);
    });
  });

  // ChatPanel

  it("renders the chat panel when an active chatroom is selected", async () => {
    // Arrange + Act
    render(<ChatLayout activeChatroomId="room-1" />);

    // Assert
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/type message here/i),
      ).toBeInTheDocument();
    });
  });

  it("fetches message history for the active chatroom", async () => {
    // Arrange + Act
    render(<ChatLayout activeChatroomId="room-1" />);

    // Assert
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
    // Arrange + Act
    render(<ChatLayout activeChatroomId="room-1" />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText("Hi there")).toBeInTheDocument();
    });
  });

  it("send button is disabled when the input is empty", async () => {
    // Arrange + Act
    render(<ChatLayout activeChatroomId="room-1" />);

    // Assert
    await waitFor(() => {
      expect(screen.getByTitle("Send")).toBeDisabled();
    });
  });

  it("send button is enabled once input has text and connection is established", async () => {
    // Arrange
    render(<ChatLayout activeChatroomId="room-1" />);
    await waitFor(() => expect(mockStart).toHaveBeenCalled());

    // Act
    const textarea = screen.getByPlaceholderText(/type message here/i);
    await act(async () => {
      fireEvent.change(textarea, { target: { value: "Hello" } });
    });

    // Assert
    await waitFor(() => {
      expect(screen.getByTitle("Send")).not.toBeDisabled();
    });
  });

  it("does not send when Enter+Shift is pressed", async () => {
    // Arrange
    render(<ChatLayout activeChatroomId="room-1" />);
    await waitFor(() => expect(mockStart).toHaveBeenCalled());

    // Act
    const textarea = screen.getByPlaceholderText(/type message here/i);
    await act(async () => {
      fireEvent.change(textarea, { target: { value: "Draft" } });
      fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    });

    // Assert
    expect(mockInvoke).not.toHaveBeenCalledWith("room-1", "Draft");
  });

  it("marks the chatroom as read when ChatPanel mounts", async () => {
    // Arrange + Act
    render(<ChatLayout activeChatroomId="room-1" />);

    // Assert
    await waitFor(() => {
      expect(mockMarkAsRead).toHaveBeenCalledWith("room-1");
    });
  });

  it("redirects to sign-in from ChatPanel when unauthenticated", async () => {
    // Arrange
    mockAuthState = {
      ...mockAuthState,
      authLoaded: true,
      isAuthenticated: false,
    };

    // Act
    render(<ChatLayout activeChatroomId="room-1" />);

    // Assert
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/auth/sign-in");
    });
  });

  // SignalR connection

  it("joins chatroom via SignalR invoke after connection starts", async () => {
    // Arrange
    render(<ChatLayout activeChatroomId="room-1" />);

    // Act
    await waitFor(() => expect(mockStart).toHaveBeenCalled());

    // Assert
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("JoinChatroom", "room-1");
    });
  });

  it("sets connected state and enables send button after SignalR starts", async () => {
    // Arrange
    render(<ChatLayout activeChatroomId="room-1" />);
    await waitFor(() => expect(mockStart).toHaveBeenCalled());

    // Act
    const textarea = screen.getByPlaceholderText(/type message here/i);
    await act(async () => {
      fireEvent.change(textarea, { target: { value: "Test" } });
    });

    // Assert
    await waitFor(() => {
      expect(screen.getByTitle("Send")).not.toBeDisabled();
    });
  });

  it("displays an error banner when SignalR connection fails", async () => {
    // Arrange
    mockStart.mockRejectedValueOnce(new Error("Network error"));

    // Act
    render(<ChatLayout activeChatroomId="room-1" />);

    // Assert
    await waitFor(() => {
      expect(
        screen.getByText(/failed to connect to chat/i),
      ).toBeInTheDocument();
    });
  });

  it("appends a new message to the panel when ReceiveMessage SignalR event fires", async () => {
    // Arrange
    let receiveMessageHandler: ((msg: unknown) => void) | null = null;
    mockOn.mockImplementation(
      (event: string, handler: (msg: unknown) => void) => {
        if (event === "ReceiveMessage") receiveMessageHandler = handler;
      },
    );
    render(<ChatLayout activeChatroomId="room-1" />);
    await waitFor(() => expect(mockStart).toHaveBeenCalled());

    // Act
    await act(async () => {
      receiveMessageHandler?.({
        id: "m-new",
        content: "Pushed from server",
        author: "seller-abc",
        chatroomId: "room-1",
        sendDate: "2026-01-01T10:05:00Z",
      });
    });

    // Assert
    expect(screen.getByText("Pushed from server")).toBeInTheDocument();
  });

  it("displays a SignalR server error when the Error event fires", async () => {
    // Arrange
    let errorHandler: ((err: string) => void) | null = null;
    mockOn.mockImplementation(
      (event: string, handler: (err: string) => void) => {
        if (event === "Error") errorHandler = handler;
      },
    );
    render(<ChatLayout activeChatroomId="room-1" />);
    await waitFor(() => expect(mockStart).toHaveBeenCalled());

    // Act
    await act(async () => {
      errorHandler?.("Something went wrong on the hub");
    });

    // Assert
    expect(
      screen.getByText("Something went wrong on the hub"),
    ).toBeInTheDocument();
  });

  it("sends a message via SignalR invoke when Enter is pressed", async () => {
    // Arrange
    render(<ChatLayout activeChatroomId="room-1" />);
    await waitFor(() => expect(mockStart).toHaveBeenCalled());
    const textarea = screen.getByPlaceholderText(/type message here/i);

    // Act
    await act(async () => {
      fireEvent.change(textarea, { target: { value: "Hello server" } });
      fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    });

    // Assert
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith(
        "SendMessage",
        "room-1",
        "Hello server",
      );
    });
  });

  it("sends a message via SignalR invoke when the Send button is clicked", async () => {
    // Arrange
    render(<ChatLayout activeChatroomId="room-1" />);
    await waitFor(() => expect(mockStart).toHaveBeenCalled());
    const textarea = screen.getByPlaceholderText(/type message here/i);

    // Act
    await act(async () => {
      fireEvent.change(textarea, { target: { value: "Click send" } });
    });
    await act(async () => {
      fireEvent.click(screen.getByTitle("Send"));
    });

    // Assert
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith(
        "SendMessage",
        "room-1",
        "Click send",
      );
    });
  });

  it("clears the input after a message is sent", async () => {
    // Arrange
    render(<ChatLayout activeChatroomId="room-1" />);
    await waitFor(() => expect(mockStart).toHaveBeenCalled());
    const textarea = screen.getByPlaceholderText(/type message here/i);

    // Act
    await act(async () => {
      fireEvent.change(textarea, { target: { value: "Will be cleared" } });
      fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    });

    // Assert
    await waitFor(() => {
      expect(textarea).toHaveValue("");
    });
  });

  // Message history sorting

  it("displays messages sorted chronologically regardless of fetch order", async () => {
    // Arrange – return messages out of order
    const reversedMessages = [
      {
        id: "m2",
        content: "Second message",
        author: "user-123",
        chatroomId: "room-1",
        sendDate: "2026-01-01T10:01:00Z",
      },
      {
        id: "m1",
        content: "First message",
        author: "seller-abc",
        chatroomId: "room-1",
        sendDate: "2026-01-01T10:00:00Z",
      },
    ];
    setupFetch(mockChatrooms, reversedMessages);

    // Act
    render(<ChatLayout activeChatroomId="room-1" />);

    // Assert – first message should appear before second in the DOM
    await waitFor(() => {
      const msgs = screen.getAllByText(/first message|second message/i);
      expect(msgs[0]).toHaveTextContent("First message");
      expect(msgs[1]).toHaveTextContent("Second message");
    });
  });

  it("logs an error and shows no messages when message fetch fails", async () => {
    // Arrange
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === "/api/chat/chatrooms") {
        return Promise.resolve({ ok: true, json: async () => mockChatrooms });
      }
      if (url.includes("/messages")) {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: async () => ({}),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Act
    render(<ChatLayout activeChatroomId="room-1" />);
    await waitFor(() => expect(mockStart).toHaveBeenCalled());

    // Assert
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("enables the Actions (+) button when the current user is the seller and the deal is open", async () => {
    // Arrange
    mockAuthState = { ...mockAuthState, userId: "seller-abc" };
    setupFetch([makeSellerRoom()], mockMessages);

    // Act
    render(<ChatLayout activeChatroomId="room-1" />);

    // Assert – the + button should not be disabled
    await waitFor(() => {
      expect(screen.getByTitle("Actions")).not.toBeDisabled();
    });
  });

  it("shows 'Close Deal' menu option after the Actions (+) button is clicked", async () => {
    // Arrange
    mockAuthState = { ...mockAuthState, userId: "seller-abc" };
    setupFetch([makeSellerRoom()], mockMessages);
    render(<ChatLayout activeChatroomId="room-1" />);
    await waitFor(() =>
      expect(screen.getByTitle("Actions")).not.toBeDisabled(),
    );

    // Act
    fireEvent.click(screen.getByTitle("Actions"));

    // Assert
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /close deal/i }),
      ).toBeInTheDocument();
    });
  });

  it("opens the close-deal confirmation prompt when 'Close Deal' is selected from the menu", async () => {
    // Arrange
    mockAuthState = { ...mockAuthState, userId: "seller-abc" };
    setupFetch([makeSellerRoom()], mockMessages);
    render(<ChatLayout activeChatroomId="room-1" />);
    await waitFor(() =>
      expect(screen.getByTitle("Actions")).not.toBeDisabled(),
    );
    fireEvent.click(screen.getByTitle("Actions"));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /close deal/i }),
      ).toBeInTheDocument(),
    );

    // Act
    fireEvent.click(screen.getByRole("button", { name: /close deal/i }));

    // Assert – confirmation card with Yes / No buttons appears
    await waitFor(() => {
      expect(
        screen.getByText(/close deal/i, { selector: "h3" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /^yes$/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^no$/i })).toBeInTheDocument();
    });
  });

  it("closes the confirmation prompt when No is clicked", async () => {
    // Arrange
    mockAuthState = { ...mockAuthState, userId: "seller-abc" };
    setupFetch([makeSellerRoom()], mockMessages);
    render(<ChatLayout activeChatroomId="room-1" />);
    await waitFor(() =>
      expect(screen.getByTitle("Actions")).not.toBeDisabled(),
    );
    fireEvent.click(screen.getByTitle("Actions"));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /close deal/i }),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: /close deal/i }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /^yes$/i }),
      ).toBeInTheDocument(),
    );

    // Act
    fireEvent.click(screen.getByRole("button", { name: /^no$/i }));

    // Assert
    await waitFor(() => {
      expect(
        screen.queryByText(/close deal/i, { selector: "h3" }),
      ).not.toBeInTheDocument();
    });
  });

  it("submits the close-request via POST to /close-request when Yes is clicked", async () => {
    // Arrange
    mockAuthState = { ...mockAuthState, userId: "seller-abc" };
    const updatedRoom = { ...makeSellerRoom(), isDealClosed: true };
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === "/api/chat/chatrooms") {
        return Promise.resolve({
          ok: true,
          json: async () => [makeSellerRoom()],
        });
      }
      if (url.includes("/messages")) {
        return Promise.resolve({ ok: true, json: async () => mockMessages });
      }
      if (url.includes("/close-request")) {
        return Promise.resolve({ ok: true, json: async () => updatedRoom });
      }
      if (url.includes("/api/profile/")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            firstName: "Alice",
            lastName: "Smith",
            profileImagePath: null,
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    render(<ChatLayout activeChatroomId="room-1" />);
    await waitFor(() =>
      expect(screen.getByTitle("Actions")).not.toBeDisabled(),
    );
    fireEvent.click(screen.getByTitle("Actions"));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /close deal/i }),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: /close deal/i }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /^yes$/i }),
      ).toBeInTheDocument(),
    );

    // Act
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^yes$/i }));
    });

    // Assert
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/chat/chatrooms/room-1/close-request",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  it("shows an error banner when the close-request API call fails", async () => {
    // Arrange
    mockAuthState = { ...mockAuthState, userId: "seller-abc" };
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === "/api/chat/chatrooms") {
        return Promise.resolve({
          ok: true,
          json: async () => [makeSellerRoom()],
        });
      }
      if (url.includes("/messages")) {
        return Promise.resolve({ ok: true, json: async () => mockMessages });
      }
      if (url.includes("/close-request")) {
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: "Deal already closed" }),
        });
      }
      if (url.includes("/api/profile/")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            firstName: "Alice",
            lastName: "Smith",
            profileImagePath: null,
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    render(<ChatLayout activeChatroomId="room-1" />);
    await waitFor(() =>
      expect(screen.getByTitle("Actions")).not.toBeDisabled(),
    );
    fireEvent.click(screen.getByTitle("Actions"));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /close deal/i }),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: /close deal/i }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /^yes$/i }),
      ).toBeInTheDocument(),
    );

    // Act
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^yes$/i }));
    });

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/deal already closed/i)).toBeInTheDocument();
    });
  });

  it("disables the Actions (+) button when the deal is already closed", async () => {
    // Arrange
    mockAuthState = { ...mockAuthState, userId: "seller-abc" };
    setupFetch([makeSellerRoom({ isDealClosed: true })], mockMessages);

    // Act
    render(<ChatLayout activeChatroomId="room-1" />);

    // Assert
    await waitFor(() => {
      expect(screen.getByTitle("Actions")).toBeDisabled();
    });
  });

  it("shows the inline rating prompt automatically when the deal is closed and the user has not yet rated", async () => {
    // Arrange – deal closed, buyer has not rated
    const closedRoom = {
      ...mockChatrooms[0],
      isDealClosed: true,
      ratings: [],
    };
    setupFetch([closedRoom], mockMessages);

    // Act
    render(<ChatLayout activeChatroomId="room-1" />);

    // Assert
    await waitFor(() => {
      expect(
        screen.getByText(/leave a rating/i, { selector: "h3" }),
      ).toBeInTheDocument();
    });
  });

  it("renders all 5 star buttons inside the rating prompt", async () => {
    // Arrange
    const closedRoom = { ...mockChatrooms[0], isDealClosed: true, ratings: [] };
    setupFetch([closedRoom], mockMessages);

    // Act
    render(<ChatLayout activeChatroomId="room-1" />);
    await waitFor(() =>
      expect(
        screen.getByText(/leave a rating/i, { selector: "h3" }),
      ).toBeInTheDocument(),
    );

    // Assert
    for (let star = 1; star <= 5; star++) {
      expect(
        screen.getByRole("button", {
          name: new RegExp(`rate ${star} star`, "i"),
        }),
      ).toBeInTheDocument();
    }
  });

  it("disables the Submit rating button when no star has been selected", async () => {
    // Arrange
    const closedRoom = { ...mockChatrooms[0], isDealClosed: true, ratings: [] };
    setupFetch([closedRoom], mockMessages);

    // Act
    render(<ChatLayout activeChatroomId="room-1" />);
    await waitFor(() =>
      expect(
        screen.getByText(/leave a rating/i, { selector: "h3" }),
      ).toBeInTheDocument(),
    );

    // Assert
    expect(
      screen.getByRole("button", { name: /submit rating/i }),
    ).toBeDisabled();
  });

  it("enables the Submit rating button once a star is clicked", async () => {
    // Arrange
    const closedRoom = { ...mockChatrooms[0], isDealClosed: true, ratings: [] };
    setupFetch([closedRoom], mockMessages);
    render(<ChatLayout activeChatroomId="room-1" />);
    await waitFor(() =>
      expect(
        screen.getByText(/leave a rating/i, { selector: "h3" }),
      ).toBeInTheDocument(),
    );

    // Act
    fireEvent.click(screen.getByRole("button", { name: /rate 5 star/i }));

    // Assert
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /submit rating/i }),
      ).not.toBeDisabled();
    });
  });

  it("enables the description textarea after a star is clicked", async () => {
    // Arrange
    const closedRoom = { ...mockChatrooms[0], isDealClosed: true, ratings: [] };
    setupFetch([closedRoom], mockMessages);
    render(<ChatLayout activeChatroomId="room-1" />);
    await waitFor(() =>
      expect(
        screen.getByText(/leave a rating/i, { selector: "h3" }),
      ).toBeInTheDocument(),
    );

    // Act
    fireEvent.click(screen.getByRole("button", { name: /rate 3 star/i }));

    // Assert
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/optional description/i),
      ).not.toBeDisabled();
    });
  });

  it("submits the rating via POST when Submit rating is clicked with a star selected", async () => {
    // Arrange
    const closedRoom = { ...mockChatrooms[0], isDealClosed: true, ratings: [] };
    const updatedRoom = {
      ...closedRoom,
      ratings: [
        {
          id: "r1",
          chatroomId: "room-1",
          reviewerId: "user-123",
          revieweeId: "seller-abc",
          stars: 5,
          createdAt: "2026-01-01T11:00:00Z",
        },
      ],
    };
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === "/api/chat/chatrooms") {
        return Promise.resolve({ ok: true, json: async () => [closedRoom] });
      }
      if (url.includes("/messages")) {
        return Promise.resolve({ ok: true, json: async () => mockMessages });
      }
      if (url.includes("/ratings")) {
        return Promise.resolve({ ok: true, json: async () => updatedRoom });
      }
      if (url.includes("/api/profile/")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            firstName: "Alice",
            lastName: "Smith",
            profileImagePath: null,
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    render(<ChatLayout activeChatroomId="room-1" />);
    await waitFor(() =>
      expect(
        screen.getByText(/leave a rating/i, { selector: "h3" }),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: /rate 5 star/i }));

    // Act
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /submit rating/i }));
    });

    // Assert
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/chat/chatrooms/room-1/ratings",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ stars: 5, description: null }),
        }),
      );
    });
  });

  it("shows an error banner when the rating API call fails", async () => {
    // Arrange
    const closedRoom = { ...mockChatrooms[0], isDealClosed: true, ratings: [] };
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === "/api/chat/chatrooms") {
        return Promise.resolve({ ok: true, json: async () => [closedRoom] });
      }
      if (url.includes("/messages")) {
        return Promise.resolve({ ok: true, json: async () => mockMessages });
      }
      if (url.includes("/ratings")) {
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: "Already rated" }),
        });
      }
      if (url.includes("/api/profile/")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            firstName: "Alice",
            lastName: "Smith",
            profileImagePath: null,
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    render(<ChatLayout activeChatroomId="room-1" />);
    await waitFor(() =>
      expect(
        screen.getByText(/leave a rating/i, { selector: "h3" }),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: /rate 3 star/i }));

    // Act
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /submit rating/i }));
    });

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/already rated/i)).toBeInTheDocument();
    });
  });

  it("dismisses the rating prompt when 'No rating' is clicked", async () => {
    // Arrange
    const closedRoom = { ...mockChatrooms[0], isDealClosed: true, ratings: [] };
    setupFetch([closedRoom], mockMessages);
    render(<ChatLayout activeChatroomId="room-1" />);
    await waitFor(() =>
      expect(
        screen.getByText(/leave a rating/i, { selector: "h3" }),
      ).toBeInTheDocument(),
    );

    // Act
    fireEvent.click(screen.getByRole("button", { name: /no rating/i }));

    // Assert
    await waitFor(() => {
      expect(
        screen.queryByText(/leave a rating/i, { selector: "h3" }),
      ).not.toBeInTheDocument();
    });
  });

  it("resets stars and disables the description textarea when Skip is clicked", async () => {
    // Arrange
    const closedRoom = { ...mockChatrooms[0], isDealClosed: true, ratings: [] };
    setupFetch([closedRoom], mockMessages);
    render(<ChatLayout activeChatroomId="room-1" />);
    await waitFor(() =>
      expect(
        screen.getByText(/leave a rating/i, { selector: "h3" }),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: /rate 2 star/i }));

    // Act
    fireEvent.click(screen.getByRole("button", { name: /^skip$/i }));

    // Assert – description textarea goes back to disabled
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(
          /select a star rating to add a description/i,
        ),
      ).toBeDisabled();
    });
  });
});
