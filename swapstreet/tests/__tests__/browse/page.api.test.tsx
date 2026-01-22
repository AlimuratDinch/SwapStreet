import { fetchClothingItems, fetchSearchPage } from '@/app/browse/page';

describe('browse page API helpers', () => {
  const realFetch = global.fetch;

  afterEach(() => {
    global.fetch = realFetch;
    jest.clearAllMocks();
  });

  it('returns array when API responds with array directly', async () => {
    const data = [{ id: '1' }, { id: '2' }];
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => data }) as any;

    const res = await fetchClothingItems(Promise.resolve({}));
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(2);
  });

  it('returns items when API responds with { items: [...] }', async () => {
    const payload = { items: [{ id: 'a' }] };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => payload }) as any;

    const res = await fetchClothingItems(Promise.resolve({ minPrice: '10' }));
    expect(res).toEqual(payload.items);
    // verify fetch call included minPrice
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toMatch(/minPrice=10/);
  });

  it('returns empty array on non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 }) as any;
    const res = await fetchClothingItems(Promise.resolve({}));
    expect(res).toEqual([]);
  });

  it('fetchSearchPage returns items + cursor + hasNextPage', async () => {
    const payload = { items: [{ id: 'x' }], nextCursor: 'cursor1', hasNextPage: true };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => payload }) as any;

    const res = await fetchSearchPage(Promise.resolve({ categoryId: '2' }));
    expect(res.items).toEqual(payload.items);
    expect(res.nextCursor).toBe('cursor1');
    expect(res.hasNextPage).toBe(true);
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toMatch(/limit=18/);
  });

  it('fetchSearchPage handles array response', async () => {
    const arr = [{ id: 'z' }];
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => arr }) as any;
    const res = await fetchSearchPage(Promise.resolve({}));
    expect(res.items).toEqual(arr);
    expect(res.nextCursor).toBeNull();
    expect(res.hasNextPage).toBe(false);
  });

  it('fetchSearchPage returns defaults on error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('boom')) as any;
    const res = await fetchSearchPage(Promise.resolve({}));
    expect(res).toEqual({ items: [], nextCursor: null, hasNextPage: false });
  });
});
