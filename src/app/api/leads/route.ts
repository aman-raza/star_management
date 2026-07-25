import { NextRequest, NextResponse } from "next/server";
import { leadCaptureSchema, leadsQuerySchema } from "@/lib/validations";
import { requireAuth } from "@/lib/permissions";
import { createLead, getLeads } from "@/services/lead.service";

/**
 * POST /api/leads — Public lead capture form submission
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = leadCaptureSchema.safeParse(body);

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

    const lead = await createLead(parsed.data);

    return NextResponse.json(
      { data: lead, message: "Lead submitted successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/leads — List leads with pagination and filtering (role-aware)
 * Admin: sees all leads
 * Member: sees only leads assigned to them
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if ("error" in authResult) return authResult.error;

    const { user } = authResult;
    const { searchParams } = new URL(request.url);

    const queryInput = {
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      status: searchParams.get("status") || undefined,
      assignedTo: searchParams.get("assignedTo") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
    };

    const parsed = leadsQuerySchema.safeParse(queryInput);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: parsed.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }

    // Member: force filter to only their assigned leads
    const assignedToFilter = user.role === "member" ? user.id : undefined;

    const result = await getLeads(parsed.data, assignedToFilter);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
