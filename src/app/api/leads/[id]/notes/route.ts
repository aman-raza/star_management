import { NextRequest, NextResponse } from "next/server";
import { noteCreateSchema } from "@/lib/validations";
import { requireLeadAccess } from "@/lib/permissions";
import { addNote } from "@/services/lead.service";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/leads/:id/notes — Add a note to a lead
 * Admin: can add notes to any lead
 * Member: can only add notes to leads assigned to them
 * Notes are append-only (no edit/delete)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const accessResult = await requireLeadAccess(id);
    if ("error" in accessResult) return accessResult.error;

    const body = await request.json();
    const parsed = noteCreateSchema.safeParse(body);

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

    const note = await addNote(id, accessResult.user.id, parsed.data.content);

    return NextResponse.json({ data: note }, { status: 201 });
  } catch (error) {
    console.error("Error adding note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
