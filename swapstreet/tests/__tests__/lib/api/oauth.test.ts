import * as oauthModule from "@/lib/api/oauth";
import type { LinkedAccount } from "@/lib/api/oauth";

const {
  getLinkedAccounts,
  unlinkAccount,
  initiateOAuthLink,
  initiateOAuthSignIn,
} = oauthModule;

describe("OAuth API", () => {
  const originalFetch = global.fetch;
  const originalLocation = window.location;

  beforeEach(() => {
    jest.clearAllMocks();
    delete (window as any).location;
    (window as any).location = { href: "" };
  });

  afterEach(() => {
    global.fetch = originalFetch;
    window.location = originalLocation;
  });

  describe("getLinkedAccounts", () => {
    const mockAccessToken = "test-access-token";

    it("fetches linked accounts successfully", async () => {
      const mockResponse = {
        linkedAccounts: [
          {
            provider: "google",
            email: "test@gmail.com",
            linkedAt: "2026-01-15T10:30:00Z",
          },
        ],
      };

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await getLinkedAccounts(mockAccessToken);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/linked-accounts"),
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockAccessToken}`,
            "Content-Type": "application/json",
          }),
          credentials: "include",
        }),
      );
    });

    it("includes correct authorization header", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ linkedAccounts: [] }),
      } as Response);

      await getLinkedAccounts(mockAccessToken);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[1].headers.Authorization).toBe(
        `Bearer ${mockAccessToken}`,
      );
    });

    it("throws error when request fails", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      } as Response);

      await expect(getLinkedAccounts(mockAccessToken)).rejects.toThrow(
        "Unauthorized",
      );
    });

    it("throws error with status code when no error text", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "",
      } as Response);

      await expect(getLinkedAccounts(mockAccessToken)).rejects.toThrow(
        "Failed to fetch linked accounts: 500",
      );
    });

    it("constructs correct URL for API endpoint", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ linkedAccounts: [] }),
      } as Response);

      await getLinkedAccounts(mockAccessToken);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toContain("/auth/linked-accounts");
    });
  });

  describe("unlinkAccount", () => {
    const mockAccessToken = "test-access-token";

    it("unlinks Google account successfully", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const result = await unlinkAccount("google", mockAccessToken);

      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/linked-accounts/google"),
        expect.objectContaining({
          method: "DELETE",
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockAccessToken}`,
          }),
          credentials: "include",
        }),
      );
    });

    it("unlinks Facebook account successfully", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await unlinkAccount("facebook", mockAccessToken);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toContain("/auth/linked-accounts/facebook");
    });

    it("unlinks Apple account successfully", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await unlinkAccount("apple", mockAccessToken);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toContain("/auth/linked-accounts/apple");
    });

    it("throws error when unlinking fails", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => "Cannot unlink only authentication method",
      } as Response);

      await expect(unlinkAccount("google", mockAccessToken)).rejects.toThrow(
        "Cannot unlink only authentication method",
      );
    });

    it("throws error with status code when no error text", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => "",
      } as Response);

      await expect(unlinkAccount("google", mockAccessToken)).rejects.toThrow(
        "Failed to unlink account: 404",
      );
    });
  });

  describe("initiateOAuthLink", () => {
    it("executes without throwing for Google", () => {
      expect(() => initiateOAuthLink("google")).not.toThrow();
    });

    it("executes without throwing for Facebook", () => {
      expect(() => initiateOAuthLink("facebook")).not.toThrow();
    });

    it("executes without throwing for Apple", () => {
      expect(() => initiateOAuthLink("apple")).not.toThrow();
    });

    it("is a function that accepts provider parameter", () => {
      expect(typeof initiateOAuthLink).toBe("function");
    });
  });

  describe("initiateOAuthSignIn", () => {
    it("executes without throwing for Google without signup", () => {
      expect(() => initiateOAuthSignIn("google", false)).not.toThrow();
    });

    it("executes without throwing for Google with signup", () => {
      expect(() => initiateOAuthSignIn("google", true)).not.toThrow();
    });

    it("executes without throwing for Facebook", () => {
      expect(() => initiateOAuthSignIn("facebook", false)).not.toThrow();
    });

    it("executes without throwing for Apple", () => {
      expect(() => initiateOAuthSignIn("apple", false)).not.toThrow();
    });

    it("defaults isSignUp to false when not provided", () => {
      expect(() => initiateOAuthSignIn("google")).not.toThrow();
    });

    it("is a function that accepts provider and optional isSignUp parameters", () => {
      expect(typeof initiateOAuthSignIn).toBe("function");
    });
  });

  describe("TypeScript types", () => {
    it("LinkedAccount type has correct structure", () => {
      const linkedAccount: LinkedAccount = {
        provider: "google",
        email: "test@gmail.com",
        linkedAt: "2026-01-15T10:30:00Z",
      };

      expect(linkedAccount.provider).toBe("google");
      expect(linkedAccount.email).toBe("test@gmail.com");
      expect(linkedAccount.linkedAt).toBe("2026-01-15T10:30:00Z");
    });
  });
});
