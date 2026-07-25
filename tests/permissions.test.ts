import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { GET as getLeads, POST as createLead } from "@/app/api/leads/route";
import { GET as getLead, PATCH as updateLead } from "@/app/api/leads/[id]/route";
import { PATCH as assignLead } from "@/app/api/leads/[id]/assign/route";
import { POST as addNote } from "@/app/api/leads/[id]/notes/route";
import { GET as getUsers, POST as createUser } from "@/app/api/users/route";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

// Helper to cast mocked function
const mockedAuth = auth as any;

describe("Permission Enforcement Tests", () => {
  let adminUser: any;
  let member1User: any;
  let member2User: any;
  let lead1AssignedToMember1: any;
  let lead2Unassigned: any;

  beforeEach(async () => {
    // Clean database before each test suite setup
    await prisma.activityLog.deleteMany();
    await prisma.note.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.user.deleteMany();

    const pw = await bcrypt.hash("password123", 10);

    // Create users
    adminUser = await prisma.user.create({
      data: { email: "admin_test@test.com", passwordHash: pw, name: "Admin Test", role: "admin" },
    });

    member1User = await prisma.user.create({
      data: { email: "member1_test@test.com", passwordHash: pw, name: "Member 1 Test", role: "member" },
    });

    member2User = await prisma.user.create({
      data: { email: "member2_test@test.com", passwordHash: pw, name: "Member 2 Test", role: "member" },
    });

    // Create leads
    lead1AssignedToMember1 = await prisma.lead.create({
      data: {
        name: "Lead 1",
        email: "lead1@test.com",
        company: "Company 1",
        message: "Message 1",
        source: "website",
        status: "new",
        assignedToId: member1User.id,
      },
    });

    lead2Unassigned = await prisma.lead.create({
      data: {
        name: "Lead 2",
        email: "lead2@test.com",
        company: "Company 2",
        message: "Message 2",
        source: "referral",
        status: "new",
        assignedToId: null,
      },
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

  // Helper to create Request object
  function createRequest(url: string, method: string, body?: any) {
    return new NextRequest(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // ─── 1. Unauthenticated Access ──────────────────────────────────────────────
  describe("Unauthenticated Access", () => {
    beforeEach(() => {
      mockedAuth.mockResolvedValue(null);
    });

    it("should reject listing leads with 401", async () => {
      const req = createRequest("http://localhost/api/leads", "GET");
      const res = await getLeads(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain("Authentication required");
    });

    it("should reject lead detail access with 401", async () => {
      const req = createRequest(`http://localhost/api/leads/${lead1AssignedToMember1.id}`, "GET");
      const res = await getLead(req, { params: Promise.resolve({ id: lead1AssignedToMember1.id }) });
      expect(res.status).toBe(401);
    });

    it("should reject status updates with 401", async () => {
      const req = createRequest(`http://localhost/api/leads/${lead1AssignedToMember1.id}`, "PATCH", { status: "contacted" });
      const res = await updateLead(req, { params: Promise.resolve({ id: lead1AssignedToMember1.id }) });
      expect(res.status).toBe(401);
    });
  });

  // ─── 2. Member Access (Permitted actions) ──────────────────────────────────
  describe("Member Access (Permitted on Own Leads)", () => {
    beforeEach(() => {
      mockedAuth.mockResolvedValue({
        user: { id: member1User.id, email: member1User.email, name: member1User.name, role: "member" },
      });
    });

    it("should allow getting own leads", async () => {
      const req = createRequest("http://localhost/api/leads", "GET");
      const res = await getLeads(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toHaveLength(1);
      expect(body.data[0].id).toBe(lead1AssignedToMember1.id);
    });

    it("should allow updating own lead status", async () => {
      const req = createRequest(`http://localhost/api/leads/${lead1AssignedToMember1.id}`, "PATCH", { status: "contacted" });
      const res = await updateLead(req, { params: Promise.resolve({ id: lead1AssignedToMember1.id }) });
      expect(res.status).toBe(200);

      const lead = await prisma.lead.findUnique({ where: { id: lead1AssignedToMember1.id } });
      expect(lead?.status).toBe("contacted");
    });

    it("should allow adding note to own lead", async () => {
      const req = createRequest(`http://localhost/api/leads/${lead1AssignedToMember1.id}/notes`, "POST", { content: "Member note" });
      const res = await addNote(req, { params: Promise.resolve({ id: lead1AssignedToMember1.id }) });
      expect(res.status).toBe(201);
    });
  });

  // ─── 3. Member Access Control (Forbidden actions) ──────────────────────────
  describe("Member Access Control (Forbidden Actions)", () => {
    beforeEach(() => {
      mockedAuth.mockResolvedValue({
        user: { id: member1User.id, email: member1User.email, name: member1User.name, role: "member" },
      });
    });

    it("should block member from accessing lead assigned to another member", async () => {
      // Reassign lead 2 to Member 2
      await prisma.lead.update({
        where: { id: lead2Unassigned.id },
        data: { assignedToId: member2User.id },
      });

      const req = createRequest(`http://localhost/api/leads/${lead2Unassigned.id}`, "GET");
      const res = await getLead(req, { params: Promise.resolve({ id: lead2Unassigned.id }) });
      expect(res.status).toBe(403);
    });

    it("should block member from updating lead status of another member's lead", async () => {
      await prisma.lead.update({
        where: { id: lead2Unassigned.id },
        data: { assignedToId: member2User.id },
      });

      const req = createRequest(`http://localhost/api/leads/${lead2Unassigned.id}`, "PATCH", { status: "contacted" });
      const res = await updateLead(req, { params: Promise.resolve({ id: lead2Unassigned.id }) });
      expect(res.status).toBe(403);
    });

    it("should block member from assigning leads (Admin only)", async () => {
      const req = createRequest(`http://localhost/api/leads/${lead1AssignedToMember1.id}/assign`, "PATCH", { assignedToId: member2User.id });
      const res = await assignLead(req, { params: Promise.resolve({ id: lead1AssignedToMember1.id }) });
      expect(res.status).toBe(403);
    });

    it("should block member from listing users (Admin only)", async () => {
      const req = createRequest("http://localhost/api/users", "GET");
      const res = await getUsers();
      expect(res.status).toBe(403);
    });

    it("should block member from creating users (Admin only)", async () => {
      const req = createRequest("http://localhost/api/users", "POST", {
        email: "new_user@test.com",
        password: "password123",
        name: "New User",
        role: "member",
      });
      const res = await createUser(req);
      expect(res.status).toBe(403);
    });
  });

  // ─── 4. Admin Access (Full Permissions) ───────────────────────────────────
  describe("Admin Access (Full Permissions)", () => {
    beforeEach(() => {
      mockedAuth.mockResolvedValue({
        user: { id: adminUser.id, email: adminUser.email, name: adminUser.name, role: "admin" },
      });
    });

    it("should allow admin to list all leads", async () => {
      const req = createRequest("http://localhost/api/leads", "GET");
      const res = await getLeads(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toHaveLength(2);
    });

    it("should allow admin to assign a lead to a member", async () => {
      const req = createRequest(`http://localhost/api/leads/${lead2Unassigned.id}/assign`, "PATCH", { assignedToId: member1User.id });
      const res = await assignLead(req, { params: Promise.resolve({ id: lead2Unassigned.id }) });
      expect(res.status).toBe(200);

      const lead = await prisma.lead.findUnique({ where: { id: lead2Unassigned.id } });
      expect(lead?.assignedToId).toBe(member1User.id);
    });

    it("should allow admin to create users", async () => {
      const req = createRequest("http://localhost/api/users", "POST", {
        email: "new_team@test.com",
        password: "password123",
        name: "New Team Member",
        role: "member",
      });
      const res = await createUser(req);
      expect(res.status).toBe(201);
    });
  });
});
