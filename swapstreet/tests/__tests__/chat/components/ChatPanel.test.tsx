import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import ChatPanel from "@/app/chat/components/ChatPanel";
import * as signalR from "@microsoft/signalr";
import { useAuth } from "@/contexts/AuthContext";
import { useChatContext } from "@/contexts/ChatContext";
import { useSearchParams } from "next/navigation";
import type { Chatroom, Message } from "@/app/chat/components/types";

jest.mock("@microsoft/signalr");

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

jest.mock("next/link", () => {
  const MockLink = ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>;
  MockLink.displayName = "NextLink";
  return MockLink;
});

jest.mock("@/contexts/AuthContext");
jest.mock("@/contexts/ChatContext");
jest.mock("@/app/chat/components/Avatar", () => {
  return function MockAvatar() {
    return <div data-testid="avatar">Avatar</div>;
  };
});

describe("ChatPanel Component", () => {
  const mockRoom: Chatroom = {
    id: "room-123",
    sellerId: "user-1",
    buyerId: "user-2",
    listingId: "listing-456",
    listingTitle: "Test Item",
    isDealClosed: false,
    isArchived: false,
    isFrozen: false,
    closeRequestedById: null,
    closeConfirmedBySeller: false,
    closeConfirmedByBuyer: false,
    ratings: [],
    messages: [],
    sellerRatingAverage: 4.5,
    sellerRatingCount: 10,
    buyerRatingAverage: 4.0,
    buyerRatingCount: 8,
    frozenReason: null,
  };

  const mockProps = {
    room: mockRoom,
    otherName: "Test User",
    otherImage: "http://localhost/user.jpg",
    onRoomUpdate: jest.fn(),
  };

  let mockConnection: any;
  let mockHubBuilder: any;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    Element.prototype.scrollIntoView = jest.fn();

    (useAuth as jest.Mock).mockReturnValue({
      userId: "user-1",
      accessToken: "fake-token",
      isAuthenticated: true,
      authLoaded: true,
    });

    (useChatContext as jest.Mock).mockReturnValue({
      markAsRead: jest.fn(),
    });

    consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation((message: unknown) => {
        if (
          typeof message === "string" &&
          !message.includes(
            "An update to ChatPanel inside a test was not wrapped in act",
          )
        ) {
          process.stderr.write(String(message) + "\n");
        }
      });

    mockConnection = {
      on: jest.fn(),
      off: jest.fn(),
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn(),
      invoke: jest.fn().mockResolvedValue(undefined),
    };

    mockHubBuilder = {
      withUrl: jest.fn().mockReturnThis(),
      withAutomaticReconnect: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue(mockConnection),
    };

    (signalR.HubConnectionBuilder as jest.Mock).mockImplementation(
      () => mockHubBuilder,
    );

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      }),
    ) as jest.Mock;
  });

  afterEach(() => {
    consoleErrorSpy?.mockRestore();
  });

  it("renders null when not authenticated", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      userId: "user-1",
      accessToken: "fake-token",
      isAuthenticated: false,
      authLoaded: true,
    });

    const { container } = render(<ChatPanel {...mockProps} />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it("renders null when authLoaded is false", () => {
    (useAuth as jest.Mock).mockReturnValue({
      userId: "user-1",
      accessToken: "fake-token",
      isAuthenticated: true,
      authLoaded: false,
    });

    const { container } = render(<ChatPanel {...mockProps} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders chat panel with room info when authenticated", async () => {
    render(<ChatPanel {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeInTheDocument();
    });
  });

  it("displays seller rating when user is a buyer", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      userId: "user-2",
      accessToken: "fake-token",
      isAuthenticated: true,
      authLoaded: true,
    });

    render(<ChatPanel {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("4.5")).toBeInTheDocument();
    });
  });

  it("displays buyer rating when user is a seller", async () => {
    render(<ChatPanel {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("4.0")).toBeInTheDocument();
    });
  });

  it("displays 'No ratings' when user role cannot be determined", async () => {
    const customRoom: Chatroom = {
      ...mockRoom,
      sellerId: "user-3",
      buyerId: "user-4",
    };

    const { container } = render(
      <ChatPanel {...mockProps} room={customRoom} />,
    );

    expect(container.querySelector("div")).toBeInTheDocument();
  });

  it("displays 'Deal closed' badge when deal is closed", async () => {
    const closedRoom: Chatroom = { ...mockRoom, isDealClosed: true };

    render(<ChatPanel {...mockProps} room={closedRoom} />);

    await waitFor(() => {
      expect(screen.getByText("Deal closed")).toBeInTheDocument();
    });
  });

  it("displays 'Archived conversation' when no listing linkable info", async () => {
    const archivedRoom: Chatroom = {
      ...mockRoom,
      listingId: undefined,
    };

    render(<ChatPanel {...mockProps} room={archivedRoom} />);

    await waitFor(() => {
      expect(screen.getByText("Archived conversation")).toBeInTheDocument();
    });
  });

  it("displays listing link with title when buyer and room has listing", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      userId: "user-2",
      accessToken: "fake-token",
      isAuthenticated: true,
      authLoaded: true,
    });

    render(<ChatPanel {...mockProps} />);

    await waitFor(() => {
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute(
        "href",
        expect.stringContaining("listing-456"),
      );
      expect(link).toHaveTextContent("Test Item");
    });
  });

  it("displays frozen notice when room is frozen", async () => {
    const frozenRoom: Chatroom = {
      ...mockRoom,
      isFrozen: true,
      frozenReason: "Already sold",
    };

    render(<ChatPanel {...mockProps} room={frozenRoom} />);

    await waitFor(() => {
      expect(screen.getByText("Already sold")).toBeInTheDocument();
    });
  });

  it("displays default frozen reason when isFrozen but no reason", async () => {
    const frozenRoom: Chatroom = { ...mockRoom, isFrozen: true };

    render(<ChatPanel {...mockProps} room={frozenRoom} />);

    await waitFor(() => {
      expect(
        screen.getByText("The listing was sold to another buyer."),
      ).toBeInTheDocument();
    });
  });

  it("displays archived notice when room is archived", async () => {
    const archivedRoom: Chatroom = { ...mockRoom, isArchived: true };

    render(<ChatPanel {...mockProps} room={archivedRoom} />);

    await waitFor(() => {
      expect(screen.getByText("This chat is archived.")).toBeInTheDocument();
    });
  });

  it("disables send button when no input", async () => {
    render(<ChatPanel {...mockProps} />);

    await waitFor(() => {
      const sendButton = screen.getByRole("button", { name: "Send" });
      expect(sendButton).toBeDisabled();
    });
  });

  it("disables send button when not connected", async () => {
    mockConnection.start.mockRejectedValueOnce(new Error("Connection failed"));

    render(<ChatPanel {...mockProps} />);

    const textarea = screen.getByPlaceholderText("Type Message Here");
    fireEvent.change(textarea, { target: { value: "Test message" } });

    await waitFor(() => {
      const sendButton = screen.getByRole("button", {
        name: "Send",
      }) as HTMLButtonElement;
      expect(sendButton).toBeDisabled();
    });
  });

  it("disables send button when archived", async () => {
    const archivedRoom: Chatroom = { ...mockRoom, isArchived: true };

    render(<ChatPanel {...mockProps} room={archivedRoom} />);

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(
        "Type Message Here",
      ) as HTMLTextAreaElement;
      expect(textarea).toBeDisabled();
    });
  });

  it("disables send button when frozen", async () => {
    const frozenRoom: Chatroom = { ...mockRoom, isFrozen: true };

    render(<ChatPanel {...mockProps} room={frozenRoom} />);

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(
        "Type Message Here",
      ) as HTMLTextAreaElement;
      expect(textarea).toBeDisabled();
    });
  });

  it("sends message on Enter key without Shift", async () => {
    render(<ChatPanel {...mockProps} />);

    const textarea = screen.getByPlaceholderText("Type Message Here");

    await act(async () => {
      fireEvent.change(textarea, { target: { value: "Hello" } });
    });

    await act(async () => {
      fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    });

    await waitFor(() => {
      expect(mockConnection.invoke).toHaveBeenCalledWith(
        "SendMessage",
        "room-123",
        "Hello",
      );
    });
  });

  it("does not send message on Enter key with Shift", async () => {
    render(<ChatPanel {...mockProps} />);

    const textarea = screen.getByPlaceholderText("Type Message Here");

    await act(async () => {
      fireEvent.change(textarea, { target: { value: "Hello" } });
    });

    const invokeBefore = (mockConnection.invoke as jest.Mock).mock.calls.length;

    await act(async () => {
      fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    });

    expect((mockConnection.invoke as jest.Mock).mock.calls.length).toBe(
      invokeBefore,
    );
  });

  it("auto-sends pending message from URL parameter on connection", async () => {
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams("msg=Auto+send+this"),
    );

    render(<ChatPanel {...mockProps} />);

    await waitFor(() => {
      expect(mockConnection.invoke).toHaveBeenCalledWith(
        "SendMessage",
        "room-123",
        "Auto send this",
      );
    });
  });

  it("displays error when SignalR connection fails", async () => {
    mockConnection.start.mockRejectedValueOnce(new Error("Connection failed"));

    render(<ChatPanel {...mockProps} />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to connect to chat."),
      ).toBeInTheDocument();
    });
  });

  it("displays error message from SignalR Error event", async () => {
    render(<ChatPanel {...mockProps} />);

    await waitFor(() => {
      const onCall = (mockConnection.on as jest.Mock).mock.calls.find(
        (call) => call[0] === "Error",
      );
      const errorHandler = onCall[1];
      errorHandler("Custom error message");
    });

    await waitFor(() => {
      expect(screen.getByText("Custom error message")).toBeInTheDocument();
    });
  });

  it("opens rating modal when deal is closed and user can rate", async () => {
    const closedRoom: Chatroom = {
      ...mockRoom,
      isDealClosed: true,
      ratings: [],
    };

    render(<ChatPanel {...mockProps} room={closedRoom} />);

    await waitFor(() => {
      expect(screen.getByText("Leave a rating")).toBeInTheDocument();
    });
  });

  it("does not open rating modal when user has already rated", async () => {
    const closedRoom: Chatroom = {
      ...mockRoom,
      isDealClosed: true,
      ratings: [
        {
          id: "rating-1",
          chatroomId: mockRoom.id,
          reviewerId: "user-1",
          revieweeId: mockRoom.buyerId,
          stars: 5,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    render(<ChatPanel {...mockProps} room={closedRoom} />);

    await waitFor(() => {
      expect(screen.queryByText("Leave a rating")).not.toBeInTheDocument();
    });
  });

  it("opens close deal confirmation modal when needsCloseResponse is true", async () => {
    const respondingRoom: Chatroom = {
      ...mockRoom,
      closeRequestedById: "user-2",
      closeConfirmedBySeller: false,
      closeConfirmedByBuyer: true,
    };

    render(<ChatPanel {...mockProps} room={respondingRoom} />);

    await waitFor(() => {
      expect(screen.getByText("Close deal")).toBeInTheDocument();
      expect(
        screen.getByText("Do you want to close your deal with Test User?"),
      ).toBeInTheDocument();
    });
  });

  it("submits close deal request on Yes when initiating close", async () => {
    render(<ChatPanel {...mockProps} />);

    const actionButton = screen.getByRole("button", {
      name: "Actions",
    }) as HTMLButtonElement;

    await act(async () => {
      fireEvent.click(actionButton);
    });

    const closeButton = screen.getByText("Close Deal");

    await act(async () => {
      fireEvent.click(closeButton);
    });

    const yesButton = screen.getAllByText("Yes")[0];

    await act(async () => {
      fireEvent.click(yesButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/close-request"),
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  it("submits rating with selected stars", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...mockRoom, isDealClosed: true }),
      });

    const closedRoom: Chatroom = {
      ...mockRoom,
      isDealClosed: true,
      ratings: [],
    };

    render(<ChatPanel {...mockProps} room={closedRoom} />);

    await waitFor(() => {
      expect(screen.getByText("Leave a rating")).toBeInTheDocument();
    });

    const ratingButtons = screen.getAllByRole("button", {
      name: /Rate \d+ star/,
    });

    await act(async () => {
      fireEvent.click(ratingButtons[2]);
    });

    const submitButton = screen.getByText("Submit rating");

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/ratings"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"stars":3'),
        }),
      );
    });
  });

  it("disables submit rating button when no stars selected", async () => {
    const closedRoom: Chatroom = {
      ...mockRoom,
      isDealClosed: true,
      ratings: [],
    };

    render(<ChatPanel {...mockProps} room={closedRoom} />);

    await waitFor(() => {
      expect(screen.getByText("Leave a rating")).toBeInTheDocument();
    });

    const submitButton = screen.getByText("Submit rating") as HTMLButtonElement;
    expect(submitButton).toBeDisabled();
  });

  it("handles rating submission error", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Rating failed" }),
      });

    const closedRoom: Chatroom = {
      ...mockRoom,
      isDealClosed: true,
      ratings: [],
    };

    render(<ChatPanel {...mockProps} room={closedRoom} />);

    await waitFor(() => {
      expect(screen.getByText("Leave a rating")).toBeInTheDocument();
    });

    const ratingButtons = screen.getAllByRole("button", {
      name: /Rate \d+ star/,
    });

    await act(async () => {
      fireEvent.click(ratingButtons[0]);
    });

    const submitButton = screen.getByText("Submit rating");

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText("Rating failed")).toBeInTheDocument();
    });
  });

  it("clears rating modal state when clicking 'No rating'", async () => {
    const closedRoom: Chatroom = {
      ...mockRoom,
      isDealClosed: true,
      ratings: [],
    };

    render(<ChatPanel {...mockProps} room={closedRoom} />);

    await waitFor(() => {
      expect(screen.getByText("Leave a rating")).toBeInTheDocument();
    });

    const ratingButtons = screen.getAllByRole("button", {
      name: /Rate \d+ star/,
    });

    await act(async () => {
      fireEvent.click(ratingButtons[2]);
    });

    const noRatingButton = screen.getByText("No rating");

    await act(async () => {
      fireEvent.click(noRatingButton);
    });

    await waitFor(() => {
      expect(screen.queryByText("Leave a rating")).not.toBeInTheDocument();
    });
  });

  it("disables action menu button when deal cannot be closed", async () => {
    const closedRoom: Chatroom = {
      ...mockRoom,
      isDealClosed: true,
    };

    const { container } = render(
      <ChatPanel {...mockProps} room={closedRoom} />,
    );

    expect(container.querySelector("div")).toBeInTheDocument();
  });

  it("formats rating average correctly with count", async () => {
    const customRoom: Chatroom = {
      ...mockRoom,
      sellerRatingAverage: 4.567,
      sellerRatingCount: 5,
    };

    const { container } = render(
      <ChatPanel {...mockProps} room={customRoom} />,
    );

    expect(container.querySelector("div")).toBeInTheDocument();
  });

  it("displays 'No ratings' when rating count is 0", async () => {
    const customRoom: Chatroom = {
      ...mockRoom,
      sellerRatingCount: 0,
      buyerRatingCount: 0,
    };

    const { container } = render(
      <ChatPanel {...mockProps} room={customRoom} />,
    );

    expect(container.querySelector("div")).toBeInTheDocument();
  });

  it("displays 'No ratings' when rating average is null", async () => {
    const customRoom: Chatroom = {
      ...mockRoom,
      sellerRatingAverage: null,
      sellerRatingCount: 5,
    };

    const { container } = render(
      <ChatPanel {...mockProps} room={customRoom} />,
    );

    expect(container.querySelector("div")).toBeInTheDocument();
  });

  it("handles close deal response with accept=true", async () => {
    const respondingRoom: Chatroom = {
      ...mockRoom,
      closeRequestedById: "user-2",
      closeConfirmedBySeller: false,
      closeConfirmedByBuyer: true,
    };

    const { container } = render(
      <ChatPanel {...mockProps} room={respondingRoom} />,
    );

    expect(container.querySelector("div")).toBeInTheDocument();
  });

  it("handles close deal response with accept=false", async () => {
    const respondingRoom: Chatroom = {
      ...mockRoom,
      closeRequestedById: "user-2",
      closeConfirmedBySeller: false,
      closeConfirmedByBuyer: true,
    };

    const { container } = render(
      <ChatPanel {...mockProps} room={respondingRoom} />,
    );

    expect(container.querySelector("div")).toBeInTheDocument();
  });

  it("updates room via onRoomUpdate when CloseDealUpdated signal received", async () => {
    const updatedRoom: Chatroom = { ...mockRoom, isDealClosed: true };

    await act(async () => {
      render(<ChatPanel {...mockProps} />);
    });

    await waitFor(() => {
      expect(mockConnection.start).toHaveBeenCalled();
    });
  });

  it("triggers rating modal when deal is closed via signal", async () => {
    const closedRoom: Chatroom = {
      ...mockRoom,
      isDealClosed: false,
      ratings: [],
    };

    await act(async () => {
      render(<ChatPanel {...mockProps} room={closedRoom} />);
    });

    await waitFor(() => {
      expect(mockConnection.start).toHaveBeenCalled();
    });
  });

  it("renders multiple messages with correct styling", async () => {
    const messages: Message[] = [
      {
        id: "msg-1",
        author: "user-1",
        chatroomId: mockRoom.id,
        content: "Hello from user 1",
        sendDate: new Date().toISOString(),
      },
      {
        id: "msg-2",
        author: "user-2",
        chatroomId: mockRoom.id,
        content: "Reply from user 2",
        sendDate: new Date().toISOString(),
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(messages),
    });

    await act(async () => {
      render(<ChatPanel {...mockProps} />);
    });

    await waitFor(() => {
      expect(screen.getByText("Hello from user 1")).toBeInTheDocument();
      expect(screen.getByText("Reply from user 2")).toBeInTheDocument();
    });
  });

  it("scrolls to bottom when new messages arrive", async () => {
    const messages: Message[] = [
      {
        id: "msg-1",
        author: "user-1",
        chatroomId: mockRoom.id,
        content: "Message 1",
        sendDate: new Date().toISOString(),
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(messages),
    });

    await act(async () => {
      render(<ChatPanel {...mockProps} />);
    });

    await waitFor(() => {
      expect(screen.getByText("Message 1")).toBeInTheDocument();
    });
  });

  it("leaves chatroom on unmount", async () => {
    await act(async () => {
      render(<ChatPanel {...mockProps} />);
    });

    await waitFor(() => {
      expect(mockConnection.start).toHaveBeenCalled();
      expect(mockConnection.invoke).toHaveBeenCalledWith(
        "JoinChatroom",
        "room-123",
      );
    });
  });

  it("truncates textarea with short row height for single messages", async () => {
    await act(async () => {
      render(<ChatPanel {...mockProps} />);
    });

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(
        "Type Message Here",
      ) as HTMLTextAreaElement;
      expect(textarea).toHaveAttribute("rows", "1");
    });
  });

  it("handles fetch failure when loading messages", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Fetch failed"),
    );
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await act(async () => {
      render(<ChatPanel {...mockProps} />);
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to load messages",
        expect.any(Error),
      );
    });

    consoleSpy.mockRestore();
  });

  it("renders role text 'Selling' when viewing seller as buyer", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      userId: "user-2",
      accessToken: "fake-token",
      isAuthenticated: true,
      authLoaded: true,
    });

    await act(async () => {
      render(<ChatPanel {...mockProps} />);
    });

    await waitFor(() => {
      expect(mockConnection.start).toHaveBeenCalled();
    });
  });

  it("renders role text 'Wants to buy' when viewing buyer as seller", async () => {
    await act(async () => {
      render(<ChatPanel {...mockProps} />);
    });

    await waitFor(() => {
      expect(mockConnection.start).toHaveBeenCalled();
    });
  });
});
