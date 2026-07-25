import prisma from "@/lib/prisma";
import { LeadStatus, Prisma } from "@/generated/prisma/client";
import type { LeadCaptureInput, LeadsQueryInput } from "@/lib/validations";

/**
 * Creates a new lead from the public capture form.
 * Atomically creates the lead and its "lead_created" activity log entry.
 */
export async function createLead(data: LeadCaptureInput) {
  return prisma.$transaction(async (tx) => {
    const lead = await tx.lead.create({
      data: {
        name: data.name,
        email: data.email,
        company: data.company,
        message: data.message,
        source: data.source,
        status: "new",
      },
    });

    await tx.activityLog.create({
      data: {
        leadId: lead.id,
        actorId: null, // system/public submission
        action: "lead_created",
        previousValue: null,
        newValue: "new",
      },
    });

    return lead;
  });
}

/**
 * Get paginated leads with filtering.
 * Admin sees all leads; member query is pre-filtered by assignedToId from the route handler.
 */
export async function getLeads(
  query: LeadsQueryInput,
  assignedToFilter?: string
) {
  const where: Prisma.LeadWhereInput = {};

  if (query.status) {
    where.status = query.status as LeadStatus;
  }

  if (query.assignedTo) {
    where.assignedToId = query.assignedTo;
  } else if (assignedToFilter) {
    // Member: only see their leads
    where.assignedToId = assignedToFilter;
  }

  if (query.dateFrom || query.dateTo) {
    where.createdAt = {};
    if (query.dateFrom) {
      where.createdAt.gte = new Date(query.dateFrom);
    }
    if (query.dateTo) {
      where.createdAt.lte = new Date(query.dateTo);
    }
  }

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.lead.count({ where }),
  ]);

  return {
    data: leads,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

/**
 * Get a single lead with all related data.
 */
export async function getLeadById(id: string) {
  return prisma.lead.findUnique({
    where: { id },
    include: {
      assignedTo: {
        select: { id: true, name: true, email: true },
      },
      notes: {
        include: {
          author: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      activities: {
        include: {
          actor: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

/**
 * Update lead status with activity logging in a transaction.
 */
export async function updateLeadStatus(
  leadId: string,
  newStatus: LeadStatus,
  actorId: string
) {
  return prisma.$transaction(async (tx) => {
    const currentLead = await tx.lead.findUniqueOrThrow({
      where: { id: leadId },
      select: { status: true },
    });

    const lead = await tx.lead.update({
      where: { id: leadId },
      data: { status: newStatus },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await tx.activityLog.create({
      data: {
        leadId,
        actorId,
        action: "status_change",
        previousValue: currentLead.status,
        newValue: newStatus,
      },
    });

    return lead;
  });
}

/**
 * Assign or reassign a lead with activity logging in a transaction.
 */
export async function assignLead(
  leadId: string,
  assignedToId: string | null,
  actorId: string
) {
  return prisma.$transaction(async (tx) => {
    const currentLead = await tx.lead.findUniqueOrThrow({
      where: { id: leadId },
      select: {
        assignedToId: true,
        assignedTo: { select: { name: true } },
      },
    });

    // Validate target user exists if assigning
    if (assignedToId) {
      const targetUser = await tx.user.findUnique({
        where: { id: assignedToId },
        select: { id: true, name: true, role: true },
      });
      if (!targetUser) {
        throw new Error("Target user not found");
      }
    }

    const lead = await tx.lead.update({
      where: { id: leadId },
      data: { assignedToId },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await tx.activityLog.create({
      data: {
        leadId,
        actorId,
        action: "assignment_change",
        previousValue: currentLead.assignedTo?.name || "Unassigned",
        newValue: lead.assignedTo?.name || "Unassigned",
      },
    });

    return lead;
  });
}

/**
 * Add a note to a lead with activity logging in a transaction.
 */
export async function addNote(
  leadId: string,
  authorId: string,
  content: string
) {
  return prisma.$transaction(async (tx) => {
    const note = await tx.note.create({
      data: {
        leadId,
        authorId,
        content,
      },
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
    });

    await tx.activityLog.create({
      data: {
        leadId,
        actorId: authorId,
        action: "note_added",
        previousValue: null,
        newValue: content.substring(0, 100), // Preview of note content
      },
    });

    return note;
  });
}

/**
 * Get activity log for a lead.
 */
export async function getLeadActivity(leadId: string) {
  return prisma.activityLog.findMany({
    where: { leadId },
    include: {
      actor: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
