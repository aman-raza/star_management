import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import { getMembers } from "@/services/user.service";

/**
 * GET /api/users/members — List all members (for assignment dropdown)
 * Any authenticated user can access this
 */
export async function GET() {
  try {
    const authResult = await requireAuth();
    if ("error" in authResult) return authResult.error;

    const members = await getMembers();
    return NextResponse.json({ data: members });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
