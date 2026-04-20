import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "./client";

jest.mock("@supabase/ssr", () => ({
  createBrowserClient: jest.fn(() => ({ auth: {} })),
  createServerClient: jest.fn(() => ({ auth: {} })),
}));

describe("lib/supabase/client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  it("returns a client object", () => {
    const client = createClient();
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
  });

  it("passes env vars to createBrowserClient", () => {
    createClient();
    expect(createBrowserClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "anon-key",
    );
  });
});
