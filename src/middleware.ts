import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't need authentication
  const publicPaths = [
    "/",
    "/login",
    "/api/auth",
  ];

  // Allow public lead submission (POST to /api/leads only)
  if (pathname === "/api/leads" && request.method === "POST") {
    return NextResponse.next();
  }

  // Check if route is public
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Protected routes: check session
  const session = await auth();

  if (!session) {
    // API routes return 401 JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Page routes redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin-only page routes
  if (pathname.startsWith("/dashboard/users")) {
    if (session.user?.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/leads/:path*",
    "/api/users/:path*",
  ],
};
