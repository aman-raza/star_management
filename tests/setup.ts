import "dotenv/config";
import { vi } from "vitest";

// Mock the NextAuth auth function globally
vi.mock("@/lib/auth", () => {
  return {
    auth: vi.fn(),
    handlers: {
      GET: vi.fn(),
      POST: vi.fn(),
    },
    signIn: vi.fn(),
    signOut: vi.fn(),
  };
});
