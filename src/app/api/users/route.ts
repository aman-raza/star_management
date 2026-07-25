import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/permissions";
import { userCreateSchema } from "@/lib/validations";
import { getUsers, createUser } from "@/services/user.service";

/**
 * GET /api/users — List all users
 * Admin only — returns 403 for members
 */
export async function GET() {
  try {
    const authResult = await requireAdmin();
    if ("error" in authResult) return authResult.error;

    const users = await getUsers();
    return NextResponse.json({ data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users — Create a new user
 * Admin only — returns 403 for members
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if ("error" in authResult) return authResult.error;

    const body = await request.json();
    const parsed = userCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 422 }
      );
    }

    try {
      const user = await createUser(parsed.data);
      return NextResponse.json({ data: user }, { status: 201 });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("already exists")
      ) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
