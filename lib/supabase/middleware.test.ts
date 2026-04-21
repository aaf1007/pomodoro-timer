import type { NextRequest } from "next/server";
import { updateSession } from "./middleware";

const getUserMock = jest.fn(async () => ({ data: { user: null }, error: null }));

jest.mock("@supabase/ssr", () => ({
  createBrowserClient: jest.fn(() => ({ auth: {} })),
  createServerClient: jest.fn(() => ({
    auth: {
      getUser: getUserMock,
    },
  })),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    next: jest.fn(() => ({
      cookies: {
        set: jest.fn(),
      },
    })),
  },
}));

describe("lib/supabase/middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  it("calls getUser and returns a response", async () => {
    const request = {
      cookies: {
        getAll: jest.fn(() => []),
        set: jest.fn(),
      },
    } as unknown as NextRequest;

    const response = await updateSession(request);

    expect(getUserMock).toHaveBeenCalled();
    expect(response).toBeDefined();
  });
});
