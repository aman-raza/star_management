import { NextRequest, NextResponse } from "next/server";
import { leadAssignSchema } from "@/lib/validations";
import { requireAdmin } from "@/lib/permissions";
import { assignLead } from "@/services/lead.service";
import prisma from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * PATCH /api/leads/:id/assign — Assign or reassign a lead to a member
 * Admin only — returns 403 for members
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Admin-only check
    const authResult = await requireAdmin();
    if ("error" in authResult) return authResult.error;

    // Check lead exists
    const lead = await prisma.lead.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = leadAssignSchema.safeParse(body);

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
      const updatedLead = await assignLead(
        id,
        parsed.data.assignedToId,
        authResult.user.id
      );
      return NextResponse.json({ data: updatedLead });
    } catch (error) {
      if (error instanceof Error && error.message === "Target user not found") {
        return NextResponse.json(
          { error: "Target user not found" },
          { status: 404 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Error assigning lead:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
