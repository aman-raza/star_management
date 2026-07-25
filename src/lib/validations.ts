import { z } from "zod";

// ─── Lead Capture Form (Public) ─────────────────────────────────────────────
export const leadCaptureSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less")
    .trim(),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .max(255, "Email must be 255 characters or less")
    .trim()
    .toLowerCase(),
  company: z
    .string()
    .min(1, "Company is required")
    .max(200, "Company must be 200 characters or less")
    .trim(),
  message: z
    .string()
    .min(1, "Message is required")
    .max(2000, "Message must be 2000 characters or less")
    .trim(),
  source: z
    .string()
    .min(1, "Source is required")
    .max(100, "Source must be 100 characters or less")
    .trim(),
});

export type LeadCaptureInput = z.infer<typeof leadCaptureSchema>;

// ─── Lead Status Update ─────────────────────────────────────────────────────
export const leadStatusSchema = z.object({
  status: z.enum(["new", "contacted", "qualified", "proposal", "won", "lost"], {
    message: "Status must be one of: new, contacted, qualified, proposal, won, lost",
  }),
});

export type LeadStatusInput = z.infer<typeof leadStatusSchema>;

// ─── Lead Assignment ─────────────────────────────────────────────────────────
export const leadAssignSchema = z.object({
  assignedToId: z
    .string()
    .min(1, "User ID is required")
    .nullable(),
});

export type LeadAssignInput = z.infer<typeof leadAssignSchema>;

// ─── Note Creation ───────────────────────────────────────────────────────────
export const noteCreateSchema = z.object({
  content: z
    .string()
    .min(1, "Note content is required")
    .max(5000, "Note must be 5000 characters or less")
    .trim(),
});

export type NoteCreateInput = z.infer<typeof noteCreateSchema>;

// ─── User Creation (Admin) ──────────────────────────────────────────────────
export const userCreateSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .max(255)
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be 128 characters or less"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less")
    .trim(),
  role: z.enum(["admin", "member"], {
    message: "Role must be either admin or member",
  }),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;

// ─── Query Params ────────────────────────────────────────────────────────────
export const leadsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["new", "contacted", "qualified", "proposal", "won", "lost"]).optional(),
  assignedTo: z.string().optional(),
  dateFrom: z.string().datetime({ offset: true }).optional().or(z.string().date().optional()),
  dateTo: z.string().datetime({ offset: true }).optional().or(z.string().date().optional()),
});

export type LeadsQueryInput = z.infer<typeof leadsQuerySchema>;
