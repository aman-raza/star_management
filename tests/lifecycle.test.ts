import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { POST as publicCreateLead } from "@/app/api/leads/route";
import { PATCH as assignLead } from "@/app/api/leads/[id]/assign/route";
import { PATCH as updateLead } from "@/app/api/leads/[id]/route";
import { POST as addNote } from "@/app/api/leads/[id]/notes/route";
import { GET as getActivity } from "@/app/api/leads/[id]/activity/route";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

const mockedAuth = auth as any;

describe("Lead Lifecycle End-to-End Test", () => {
  let adminUser: any;
  let memberUser: any;

  beforeEach(async () => {
    // Clean up
    await prisma.activityLog.deleteMany();
    await prisma.note.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.user.deleteMany();

    const pw = await bcrypt.hash("password123", 10);

    adminUser = await prisma.user.create({
      data: { email: "admin_lifecycle@test.com", passwordHash: pw, name: "Sarah Admin", role: "admin" },
    });

    memberUser = await prisma.user.create({
      data: { email: "member_lifecycle@test.com", passwordHash: pw, name: "Alice Johnson", role: "member" },
    });
  });

  afterAll(async () => {
    // Clean up
    await prisma.activityLog.deleteMany();
    await prisma.note.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  function createRequest(url: string, method: string, body?: any) {
    return new NextRequest(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  it("should run through full lead lifecycle: capture → assign → status update → note → verify activity trail", async () => {
    // ─── 1. Lead Created via Public Form ────────────────────────────────────
    mockedAuth.mockResolvedValue(null); // Public form submission

    const publicReq = createRequest("http://localhost/api/leads", "POST", {
      name: "E2E Lead",
      email: "e2e@lifecycle.com",
      company: "Lifecycle LLC",
      message: "Testing lifecycle integration.",
      source: "website",
    });

    const createRes = await publicCreateLead(publicReq);
    expect(createRes.status).toBe(201);
    const createBody = await createRes.json();
    const leadId = createBody.data.id;
    expect(leadId).toBeDefined();
    expect(createBody.data.status).toBe("new");

    // ─── 2. Admin Assigns Lead to Member ────────────────────────────────────
    mockedAuth.mockResolvedValue({
      user: { id: adminUser.id, email: adminUser.email, name: adminUser.name, role: "admin" },
    });

    const assignReq = createRequest(`http://localhost/api/leads/${leadId}/assign`, "PATCH", {
      assignedToId: memberUser.id,
    });
    const assignRes = await assignLead(assignReq, { params: Promise.resolve({ id: leadId }) });
    if (assignRes.status !== 200) {
      console.log("assignRes failed:", await assignRes.json());
    }
    expect(assignRes.status).toBe(200);

    // Verify database value
    const leadAfterAssign = await prisma.lead.findUnique({ where: { id: leadId } });
    expect(leadAfterAssign?.assignedToId).toBe(memberUser.id);

    // ─── 3. Member Updates Status to Contacted ──────────────────────────────
    mockedAuth.mockResolvedValue({
      user: { id: memberUser.id, email: memberUser.email, name: memberUser.name, role: "member" },
    });

    const statusReq = createRequest(`http://localhost/api/leads/${leadId}`, "PATCH", {
      status: "contacted",
    });
    const statusRes = await updateLead(statusReq, { params: Promise.resolve({ id: leadId }) });
    expect(statusRes.status).toBe(200);

    // ─── 4. Member Adds Note ────────────────────────────────────────────────
    const noteReq = createRequest(`http://localhost/api/leads/${leadId}/notes`, "POST", {
      content: "First call went well.",
    });
    const noteRes = await addNote(noteReq, { params: Promise.resolve({ id: leadId }) });
    expect(noteRes.status).toBe(201);

    // ─── 5. Verify Activity Trail Reflects All Changes ──────────────────────
    const activityReq = createRequest(`http://localhost/api/leads/${leadId}/activity`, "GET");
    const activityRes = await getActivity(activityReq, { params: Promise.resolve({ id: leadId }) });
    expect(activityRes.status).toBe(200);

    const activityBody = await activityRes.json();
    const activities = activityBody.data;

    // Check actions in chronological reverse order (newest first)
    expect(activities).toHaveLength(4);

    // 1. Note added (newest)
    expect(activities[0].action).toBe("note_added");
    expect(activities[0].actorId).toBe(memberUser.id);

    // 2. Status change to contacted
    expect(activities[1].action).toBe("status_change");
    expect(activities[1].actorId).toBe(memberUser.id);
    expect(activities[1].previousValue).toBe("new");
    expect(activities[1].newValue).toBe("contacted");

    // 3. Assignment change to Alice Johnson
    expect(activities[2].action).toBe("assignment_change");
    expect(activities[2].actorId).toBe(adminUser.id);
    expect(activities[2].previousValue).toBe("Unassigned");
    expect(activities[2].newValue).toBe("Alice Johnson");

    // 4. Lead created (oldest)
    expect(activities[3].action).toBe("lead_created");
    expect(activities[3].actorId).toBeNull();
  });
});
