import { getSearchResults } from "@/lib/api/browse";

describe("getSearchResults", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [],
        nextCursor: null,
        hasNextPage: false,
      }),
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("includes SellerId in the request URL when sellerId is set", async () => {
    await getSearchResults({ sellerId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain("SellerId=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    expect(url).toContain("PageSize=18");
  });

  it("caps PageSize at 50", async () => {
    await getSearchResults({ pageSize: 999 });

    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain("PageSize=50");
  });
});
