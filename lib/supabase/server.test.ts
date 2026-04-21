import { createServerClient } from "@supabase/ssr";
import { createClient } from "./server";

jest.mock("@supabase/ssr", () => ({
  createBrowserClient: jest.fn(() => ({ auth: {} })),
  createServerClient: jest.fn(() => ({ auth: {} })),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn(async () => ({
    getAll: jest.fn(() => []),
    set: jest.fn(),
  })),
}));

describe("lib/supabase/server", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  it("returns a client object", async () => {
    const client = await createClient();
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
  });

  it("passes env vars to createServerClient", async () => {
    await createClient();
    expect(createServerClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "anon-key",
      expect.objectContaining({
        cookies: expect.any(Object),
      }),
    );
  });
});
