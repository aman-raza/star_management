import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...\n");

  // Clear existing data
  await prisma.activityLog.deleteMany();
  await prisma.note.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.user.deleteMany();

  // ─── Create Users ────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("admin123!", 12);
  const memberPassword = await bcrypt.hash("member123!", 12);

  const admin = await prisma.user.create({
    data: {
      email: "admin@starmanagement.com",
      passwordHash: adminPassword,
      name: "Sarah Admin",
      role: "admin",
    },
  });

  const member1 = await prisma.user.create({
    data: {
      email: "alice@starmanagement.com",
      passwordHash: memberPassword,
      name: "Alice Johnson",
      role: "member",
    },
  });

  const member2 = await prisma.user.create({
    data: {
      email: "bob@starmanagement.com",
      passwordHash: memberPassword,
      name: "Bob Williams",
      role: "member",
    },
  });

  console.log("✅ Users created:");
  console.log(`   Admin:   admin@starmanagement.com / admin123!`);
  console.log(`   Member1: alice@starmanagement.com / member123!`);
  console.log(`   Member2: bob@starmanagement.com   / member123!\n`);

  // ─── Create Leads with varying statuses ──────────────────────────
  const leadsData = [
    {
      name: "John Smith",
      email: "john.smith@techcorp.com",
      company: "TechCorp Inc.",
      message: "Interested in your enterprise solution for our 200-person team. We need CRM integration and custom reporting.",
      source: "website",
      status: "new" as const,
      assignedToId: null,
    },
    {
      name: "Emily Chen",
      email: "emily.chen@innovatelab.io",
      company: "InnovateLab",
      message: "Looking for a scalable platform for our startup. Budget is around $5k/month.",
      source: "referral",
      status: "contacted" as const,
      assignedToId: member1.id,
    },
    {
      name: "Michael Brown",
      email: "m.brown@globalretail.com",
      company: "Global Retail Group",
      message: "Need inventory management integration with your platform. We have 50+ stores nationwide.",
      source: "linkedin",
      status: "qualified" as const,
      assignedToId: member1.id,
    },
    {
      name: "Jessica Taylor",
      email: "jessica@designstudio.co",
      company: "Design Studio Co.",
      message: "Want to explore collaboration tools for our remote design team of 30 people.",
      source: "website",
      status: "proposal" as const,
      assignedToId: member2.id,
    },
    {
      name: "David Wilson",
      email: "d.wilson@financeplus.com",
      company: "FinancePlus",
      message: "Evaluating solutions for our financial advisory team. Security compliance is critical.",
      source: "conference",
      status: "won" as const,
      assignedToId: member1.id,
    },
    {
      name: "Lisa Anderson",
      email: "lisa@healthtech.org",
      company: "HealthTech Solutions",
      message: "Interested in HIPAA-compliant features for our healthcare platform.",
      source: "referral",
      status: "lost" as const,
      assignedToId: member2.id,
    },
    {
      name: "Robert Martinez",
      email: "rob@buildright.com",
      company: "BuildRight Construction",
      message: "Looking for project management tools. Our current solution is outdated.",
      source: "google_ads",
      status: "new" as const,
      assignedToId: null,
    },
    {
      name: "Amanda White",
      email: "amanda.w@edulearn.com",
      company: "EduLearn Platform",
      message: "Need an LMS integration for our online courses. 10,000+ students.",
      source: "website",
      status: "contacted" as const,
      assignedToId: member2.id,
    },
    {
      name: "Chris Lee",
      email: "chris.lee@logisticspro.com",
      company: "LogisticsPro",
      message: "Supply chain visibility tool needed. Currently managing 500+ shipments daily.",
      source: "cold_outreach",
      status: "qualified" as const,
      assignedToId: member1.id,
    },
    {
      name: "Karen Davis",
      email: "karen@mediagroup.tv",
      company: "Media Group International",
      message: "Looking for content management and scheduling tools for our broadcasting team.",
      source: "linkedin",
      status: "new" as const,
      assignedToId: null,
    },
  ];

  for (const leadData of leadsData) {
    const lead = await prisma.lead.create({
      data: leadData,
    });

    // Create initial activity log entry
    await prisma.activityLog.create({
      data: {
        leadId: lead.id,
        actorId: null,
        action: "lead_created",
        previousValue: null,
        newValue: "new",
      },
    });

    // For leads that have been assigned, create assignment activity
    if (leadData.assignedToId) {
      const assignedUser = leadData.assignedToId === member1.id ? "Alice Johnson" : "Bob Williams";
      await prisma.activityLog.create({
        data: {
          leadId: lead.id,
          actorId: admin.id,
          action: "assignment_change",
          previousValue: "Unassigned",
          newValue: assignedUser,
        },
      });
    }

    // For leads that are not "new", create status change activities
    const statusProgression: Record<string, string[]> = {
      contacted: ["contacted"],
      qualified: ["contacted", "qualified"],
      proposal: ["contacted", "qualified", "proposal"],
      won: ["contacted", "qualified", "proposal", "won"],
      lost: ["contacted", "qualified", "lost"],
    };

    const progression = statusProgression[leadData.status];
    if (progression) {
      let prevStatus = "new";
      for (const status of progression) {
        const actorId = leadData.assignedToId || admin.id;
        await prisma.activityLog.create({
          data: {
            leadId: lead.id,
            actorId,
            action: "status_change",
            previousValue: prevStatus,
            newValue: status,
          },
        });
        prevStatus = status;
      }
    }

    // Add sample notes for some leads
    if (["contacted", "qualified", "proposal", "won"].includes(leadData.status) && leadData.assignedToId) {
      await prisma.note.create({
        data: {
          leadId: lead.id,
          authorId: leadData.assignedToId,
          content: `Initial contact made. ${leadData.name} seems very interested in our solution. Scheduled a follow-up call for next week.`,
        },
      });

      // Create note activity
      await prisma.activityLog.create({
        data: {
          leadId: lead.id,
          actorId: leadData.assignedToId,
          action: "note_added",
          previousValue: null,
          newValue: `Initial contact made. ${leadData.name} seems very interested...`,
        },
      });
    }

    if (["qualified", "proposal", "won"].includes(leadData.status) && leadData.assignedToId) {
      await prisma.note.create({
        data: {
          leadId: lead.id,
          authorId: leadData.assignedToId,
          content: `Qualification call completed. Budget confirmed. Decision maker identified. Moving to proposal stage.`,
        },
      });
    }
  }

  console.log(`✅ ${leadsData.length} leads created with activity logs and sample notes\n`);
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
