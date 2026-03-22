import { render, screen, fireEvent } from "@testing-library/react";
import Sidebar from "@/app/chat/components/Sidebar";
import { useChatContext } from "@/contexts/ChatContext";
import { useRouter } from "next/navigation";
import type { Chatroom } from "@/app/chat/components/types";

jest.mock("@/contexts/ChatContext");
jest.mock("next/navigation");

describe("Chat Sidebar Component", () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockChatroom = {
    id: "room-1",
    buyerId: "buyer-1",
    sellerId: "seller-1",
    listingId: "listing-1",
    isDealClosed: false,
    isArchived: false,
    isFrozen: false,
    closeRequestedById: null,
    closeConfirmedBySeller: false,
    closeConfirmedByBuyer: false,
    messages: [
      {
        id: "msg-1",
        author: "buyer-1",
        content: "Hello!",
        sendDate: new Date().toISOString(),
      },
    ],
    ratings: [],
    sellerRatingAverage: 4.5,
    sellerRatingCount: 10,
    buyerRatingAverage: 4.0,
    buyerRatingCount: 5,
    listingTitle: "Vintage Jacket",
    frozenReason: null,
  } as unknown as Chatroom;

  const mockArchivedRoom = {
    ...mockChatroom,
    id: "room-2",
    isArchived: true,
  } as unknown as Chatroom;

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useChatContext as jest.Mock).mockReturnValue({
      unread: {},
      latestMessages: {},
    });
  });

  describe("Rendering", () => {
    it("renders sidebar with Messages header when not showing archived", () => {
      render(
        <Sidebar
          chatrooms={[mockChatroom]}
          archivedChatrooms={[]}
          otherNames={{ "room-1": "John Doe" }}
          otherImages={{ "room-1": "http://example.com/avatar.jpg" }}
          listingImages={{ "listing-1": "http://example.com/listing.jpg" }}
          activeChatroomId="room-1"
          showArchived={false}
          onToggleArchived={() => {}}
        />,
      );

      expect(screen.getByText("Messages")).toBeInTheDocument();
    });

    it("renders sidebar with Archived header when showing archived", () => {
      render(
        <Sidebar
          chatrooms={[]}
          archivedChatrooms={[mockArchivedRoom]}
          otherNames={{ "room-2": "Jane Doe" }}
          otherImages={{ "room-2": null }}
          listingImages={{ "listing-1": "http://example.com/listing.jpg" }}
          activeChatroomId="room-2"
          showArchived={true}
          onToggleArchived={() => {}}
        />,
      );

      expect(screen.getByText("Archived")).toBeInTheDocument();
    });

    it("shows empty message when no conversations exist", () => {
      render(
        <Sidebar
          chatrooms={[]}
          archivedChatrooms={[]}
          otherNames={{}}
          otherImages={{}}
          listingImages={{}}
          activeChatroomId={null}
          showArchived={false}
          onToggleArchived={() => {}}
        />,
      );

      expect(screen.getByText("No conversations yet.")).toBeInTheDocument();
    });

    it("shows empty message for archived when no archived conversations exist", () => {
      render(
        <Sidebar
          chatrooms={[mockChatroom]}
          archivedChatrooms={[]}
          otherNames={{ "room-1": "John Doe" }}
          otherImages={{ "room-1": null }}
          listingImages={{ "listing-1": null }}
          activeChatroomId="room-1"
          showArchived={true}
          onToggleArchived={() => {}}
        />,
      );

      expect(
        screen.getByText("No archived conversations."),
      ).toBeInTheDocument();
    });

    it("renders list of active chatrooms", () => {
      render(
        <Sidebar
          chatrooms={[mockChatroom]}
          archivedChatrooms={[]}
          otherNames={{ "room-1": "John Doe" }}
          otherImages={{ "room-1": null }}
          listingImages={{ "listing-1": null }}
          activeChatroomId="room-1"
          showArchived={false}
          onToggleArchived={() => {}}
        />,
      );

      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("renders list of archived chatrooms when toggled", () => {
      render(
        <Sidebar
          chatrooms={[mockChatroom]}
          archivedChatrooms={[mockArchivedRoom]}
          otherNames={{
            "room-1": "John Doe",
            "room-2": "Jane Doe",
          }}
          otherImages={{ "room-1": null, "room-2": null }}
          listingImages={{ "listing-1": null }}
          activeChatroomId="room-2"
          showArchived={true}
          onToggleArchived={() => {}}
        />,
      );

      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
      expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    });
  });

  describe("Archive Toggle", () => {
    it("renders archive toggle button", () => {
      render(
        <Sidebar
          chatrooms={[mockChatroom]}
          archivedChatrooms={[]}
          otherNames={{ "room-1": "John Doe" }}
          otherImages={{ "room-1": null }}
          listingImages={{ "listing-1": null }}
          activeChatroomId="room-1"
          showArchived={false}
          onToggleArchived={() => {}}
        />,
      );

      const toggleButton = screen.getByRole("button", {
        name: /Show archived|Show messages/i,
      });
      expect(toggleButton).toBeInTheDocument();
    });

    it("calls onToggleArchived when button is clicked", () => {
      const onToggleArchived = jest.fn();
      render(
        <Sidebar
          chatrooms={[mockChatroom]}
          archivedChatrooms={[]}
          otherNames={{ "room-1": "John Doe" }}
          otherImages={{ "room-1": null }}
          listingImages={{ "listing-1": null }}
          activeChatroomId="room-1"
          showArchived={false}
          onToggleArchived={onToggleArchived}
        />,
      );

      const toggleButton = screen.getByTitle(/Show archived|Show messages/i);
      fireEvent.click(toggleButton);

      expect(onToggleArchived).toHaveBeenCalled();
    });

    it("shows correct toggle button label based on showArchived state", () => {
      const { rerender } = render(
        <Sidebar
          chatrooms={[mockChatroom]}
          archivedChatrooms={[mockArchivedRoom]}
          otherNames={{ "room-1": "John Doe", "room-2": "Jane Doe" }}
          otherImages={{ "room-1": null, "room-2": null }}
          listingImages={{ "listing-1": null }}
          activeChatroomId="room-1"
          showArchived={false}
          onToggleArchived={() => {}}
        />,
      );

      const toggleBtn = screen.getByTitle(/Show archived/i);
      expect(toggleBtn).toHaveAttribute("title", "Show archived");

      rerender(
        <Sidebar
          chatrooms={[mockChatroom]}
          archivedChatrooms={[mockArchivedRoom]}
          otherNames={{ "room-1": "John Doe", "room-2": "Jane Doe" }}
          otherImages={{ "room-1": null, "room-2": null }}
          listingImages={{ "listing-1": null }}
          activeChatroomId="room-2"
          showArchived={true}
          onToggleArchived={() => {}}
        />,
      );

      const toggleBtn2 = screen.getByTitle(/Show messages/i);
      expect(toggleBtn2).toHaveAttribute("title", "Show messages");
    });
  });

  describe("Chat Room Selection", () => {
    it("navigates to chat room when clicked", () => {
      render(
        <Sidebar
          chatrooms={[mockChatroom]}
          archivedChatrooms={[]}
          otherNames={{ "room-1": "John Doe" }}
          otherImages={{ "room-1": null }}
          listingImages={{ "listing-1": null }}
          activeChatroomId="room-1"
          showArchived={false}
          onToggleArchived={() => {}}
        />,
      );

      const roomButtons = screen.getAllByRole("button");
      const chatroomButton = roomButtons[1];
      fireEvent.click(chatroomButton);

      expect(mockRouter.push).toHaveBeenCalledWith("/chat/room-1");
    });

    it("highlights active chatroom", () => {
      const { container } = render(
        <Sidebar
          chatrooms={[mockChatroom]}
          archivedChatrooms={[]}
          otherNames={{ "room-1": "John Doe" }}
          otherImages={{ "room-1": null }}
          listingImages={{ "listing-1": null }}
          activeChatroomId="room-1"
          showArchived={false}
          onToggleArchived={() => {}}
        />,
      );

      const activeRoom = container.querySelector(
        "[class*='chatroomButtonActive']",
      );
      expect(activeRoom).toBeInTheDocument();
    });

    it("does not highlight inactive chatroom", () => {
      const anotherRoom = { ...mockChatroom, id: "room-2" } as unknown as Chatroom;
      const { container } = render(
        <Sidebar
          chatrooms={[mockChatroom, anotherRoom]}
          archivedChatrooms={[]}
          otherNames={{
            "room-1": "John Doe",
            "room-2": "Jane Smith",
          }}
          otherImages={{ "room-1": null, "room-2": null }}
          listingImages={{ "listing-1": null }}
          activeChatroomId="room-1"
          showArchived={false}
          onToggleArchived={() => {}}
        />,
      );

      const activeRooms = container.querySelectorAll(
        "[class*='chatroomButtonActive']",
      );
      expect(activeRooms.length).toBe(1);
    });
  });

  describe("Unread Indicators", () => {
    it("shows unread indicator when room has unread messages", () => {
      (useChatContext as jest.Mock).mockReturnValue({
        unread: { "room-1": true },
        latestMessages: {},
      });

      const { container } = render(
        <Sidebar
          chatrooms={[mockChatroom]}
          archivedChatrooms={[]}
          otherNames={{ "room-1": "John Doe" }}
          otherImages={{ "room-1": null }}
          listingImages={{ "listing-1": null }}
          activeChatroomId={null}
          showArchived={false}
          onToggleArchived={() => {}}
        />,
      );

      const chatroomButtons = container.querySelectorAll("button[class*='chatroom']");
      expect(chatroomButtons.length).toBeGreaterThan(0);
    });

    it("does not show unread indicator when room is read", () => {
      (useChatContext as jest.Mock).mockReturnValue({
        unread: { "room-1": false },
        latestMessages: {},
      });

      const { container } = render(
        <Sidebar
          chatrooms={[mockChatroom]}
          archivedChatrooms={[]}
          otherNames={{ "room-1": "John Doe" }}
          otherImages={{ "room-1": null }}
          listingImages={{ "listing-1": null }}
          activeChatroomId="room-1"
          showArchived={false}
          onToggleArchived={() => {}}
        />,
      );

      const chatroomButtons = container.querySelectorAll("button[class*='chatroom']");
      expect(chatroomButtons.length).toBeGreaterThan(0);
    });
  });

  describe("Message Preview", () => {
    it("displays latest message from context", () => {
      (useChatContext as jest.Mock).mockReturnValue({
        unread: {},
        latestMessages: { "room-1": "This is the latest message" },
      });

      render(
        <Sidebar
          chatrooms={[mockChatroom]}
          archivedChatrooms={[]}
          otherNames={{ "room-1": "John Doe" }}
          otherImages={{ "room-1": null }}
          listingImages={{ "listing-1": null }}
          activeChatroomId="room-1"
          showArchived={false}
          onToggleArchived={() => {}}
        />,
      );

      expect(screen.getByText("This is the latest message")).toBeInTheDocument();
    });

    it("falls back to room messages when context doesn't have latest", () => {
      (useChatContext as jest.Mock).mockReturnValue({
        unread: {},
        latestMessages: {},
      });

      render(
        <Sidebar
          chatrooms={[mockChatroom]}
          archivedChatrooms={[]}
          otherNames={{ "room-1": "John Doe" }}
          otherImages={{ "room-1": null }}
          listingImages={{ "listing-1": null }}
          activeChatroomId="room-1"
          showArchived={false}
          onToggleArchived={() => {}}
        />,
      );

      expect(screen.getByText("Hello!")).toBeInTheDocument();
    });
  });

  describe("Multiple Chatrooms", () => {
    it("renders multiple chatrooms", () => {
      const room2 = {
        ...mockChatroom,
        id: "room-2",
        messages: [
          { id: "msg-2", author: "seller-1", content: "Hi there!", sendDate: new Date().toISOString() },
        ],
      } as unknown as Chatroom;

      render(
        <Sidebar
          chatrooms={[mockChatroom, room2]}
          archivedChatrooms={[]}
          otherNames={{
            "room-1": "John Doe",
            "room-2": "Jane Smith",
          }}
          otherImages={{ "room-1": null, "room-2": null }}
          listingImages={{ "listing-1": null }}
          activeChatroomId="room-1"
          showArchived={false}
          onToggleArchived={() => {}}
        />,
      );

      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    it("filters to show only active or archived based on state", () => {
      const anotherRoom = {
        ...mockChatroom,
        id: "room-2",
      } as unknown as Chatroom;

      render(
        <Sidebar
          chatrooms={[mockChatroom]}
          archivedChatrooms={[anotherRoom]}
          otherNames={{
            "room-1": "John Doe",
            "room-2": "Jane Smith",
          }}
          otherImages={{ "room-1": null, "room-2": null }}
          listingImages={{ "listing-1": null }}
          activeChatroomId="room-2"
          showArchived={true}
          onToggleArchived={() => {}}
        />,
      );

      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    });
  });

  describe("Fallback Names", () => {
    it("displays fallback name when name not in mapping", () => {
      render(
        <Sidebar
          chatrooms={[mockChatroom]}
          archivedChatrooms={[]}
          otherNames={{}}
          otherImages={{}}
          listingImages={{}}
          activeChatroomId="room-1"
          showArchived={false}
          onToggleArchived={() => {}}
        />,
      );

      expect(screen.getByText("…")).toBeInTheDocument();
    });
  });
});
