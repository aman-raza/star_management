import { NextRequest, NextResponse } from "next/server";
import { leadStatusSchema } from "@/lib/validations";
import { requireLeadAccess } from "@/lib/permissions";
import { getLeadById, updateLeadStatus } from "@/services/lead.service";
import type { LeadStatus } from "@/generated/prisma/client";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/leads/:id — Get a single lead with notes and activity
 * Admin: can access any lead
 * Member: can only access leads assigned to them
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const accessResult = await requireLeadAccess(id);
    if ("error" in accessResult) return accessResult.error;

    const lead = await getLeadById(id);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ data: lead });
  } catch (error) {
    console.error("Error fetching lead:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/leads/:id — Update lead status
 * Admin: can update any lead
 * Member: can only update leads assigned to them
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const accessResult = await requireLeadAccess(id);
    if ("error" in accessResult) return accessResult.error;

    const body = await request.json();
    const parsed = leadStatusSchema.safeParse(body);

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

    const lead = await updateLeadStatus(
      id,
      parsed.data.status as LeadStatus,
      accessResult.user.id
    );

    return NextResponse.json({ data: lead });
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
