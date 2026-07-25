import { NextRequest, NextResponse } from "next/server";
import { requireLeadAccess } from "@/lib/permissions";
import { getLeadActivity } from "@/services/lead.service";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/leads/:id/activity — Get activity log for a lead
 * Admin: can view any lead's activity
 * Member: can only view activity for leads assigned to them
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const accessResult = await requireLeadAccess(id);
    if ("error" in accessResult) return accessResult.error;

    const activities = await getLeadActivity(id);

    return NextResponse.json({ data: activities });
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
