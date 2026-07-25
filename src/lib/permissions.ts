import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

/**
 * Requires authentication. Returns the authenticated user or a 401 response.
 */
export async function requireAuth(): Promise<
  { user: AuthUser } | { error: NextResponse }
> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email!,
      name: session.user.name!,
      role: session.user.role!,
    },
  };
}

/**
 * Requires the user to have a specific role. Returns 403 if not.
 */
export async function requireRole(
  role: "admin" | "member"
): Promise<{ user: AuthUser } | { error: NextResponse }> {
  const result = await requireAuth();

  if ("error" in result) return result;

  if (result.user.role !== role) {
    return {
      error: NextResponse.json(
        { error: "Forbidden: insufficient permissions" },
        { status: 403 }
      ),
    };
  }

  return result;
}

/**
 * Requires admin role.
 */
export async function requireAdmin(): Promise<
  { user: AuthUser } | { error: NextResponse }
> {
  return requireRole("admin");
}

/**
 * Requires the authenticated user to have access to a specific lead.
 * Admin can access any lead; member can only access leads assigned to them.
 */
export async function requireLeadAccess(
  leadId: string
): Promise<
  | { user: AuthUser; lead: { id: string; assignedToId: string | null } }
  | { error: NextResponse }
> {
  const result = await requireAuth();
  if ("error" in result) return result;

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, assignedToId: true },
  });

  if (!lead) {
    return {
      error: NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      ),
    };
  }

  // Admin can access any lead
  if (result.user.role === "admin") {
    return { user: result.user, lead };
  }

  // Member can only access their assigned leads
  if (lead.assignedToId !== result.user.id) {
    return {
      error: NextResponse.json(
        { error: "Forbidden: you do not have access to this lead" },
        { status: 403 }
      ),
    };
  }

  return { user: result.user, lead };
}
