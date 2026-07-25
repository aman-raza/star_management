# Task B: Legacy Codebase Assessment & Migration Plan

I took a close look at the existing codebase. While the application is functional and currently serving customers, there are several structural and security risks we need to address to make it stable, testable, and secure. Below is my assessment, a zero-downtime migration strategy, a concrete refactoring sample, and how I'd approach setting new team standards.

---

## 1. The Immediate Fires (Assessment & Priorities)

Here is what I noticed, ordered by what we need to address first:

### 1. Hardcoded Secrets in Git (Priority: Critical)
* **What's wrong**: We have database credentials and API secrets committed directly in the repository history.
* **The Risk**: Anyone with access to the repo (or if the repo ever becomes public) can access our production database, leading to potential data leaks or server takeovers.
* **Fix**: Move credentials to `.env` files (which are gitignored) and rotate the production credentials immediately.

### 2. Frontend Querying the Database Directly (Priority: High)
* **What's wrong**: Client components are calling the database directly.
* **The Risk**: Bypasses server-side authorization and validation rules. It also bloats the client bundle and exposes our database schema to the browser.
* **Fix**: Move all database queries behind server-side actions, Server Components, or REST API routes.

### 3. Business Logic Stuck in Route Handlers (Priority: Medium)
* **What's wrong**: API handlers are doing everything—session checks, request parsing, database updates, and formatting responses.
* **The Risk**: Hard to test, duplicate logic across different files, and a high chance of forgetting steps (like writing to the activity trail).
* **Fix**: Pull the core logic out of route handlers and put it into a dedicated service layer (like `lead.service.ts`).

### 4. Zero Tests (Priority: High)
* **What's wrong**: There are no unit or integration tests.
* **The Risk**: Any new feature or bug fix could quietly break something else in production.
* **Fix**: Introduce Vitest and write basic tests covering authentication and core lead lifecycle paths.

---

## 2. The Plan: How to Migrate Without Breaking Production

Since this app is serving real customers, a "big-bang" rewrite is out of the question. We'll use the **Strangler Fig Pattern** to replace legacy paths incrementally:

### 🚀 Week 1: Plug the Security Holes
* **Secrets Cleanup**: Move credentials to Vercel/environment variables and change the production database password.
* **Basic CI**: Set up a simple GitHub Actions workflow to run type-checking (`tsc --noEmit`) and linting on every pull request.
* **Sanitize Inputs**: Put Zod validation on public inputs (like the lead capture form) to block malicious inputs.

### 🚀 Month 1: Decouple Frontend & Backend
* **Introduce Services**: Create a service layer for leads and users.
* **Clean up Components**: Refactor frontend components to read from API endpoints rather than querying the database directly.
* **Atomic Timeline updates**: Make sure all database mutations (like updating status and logging the activity) happen inside a transaction so we never get partial writes.

### 🚀 Quarter 1: Full Test Coverage & Monitoring
* **Clean Route Handlers**: Slim down API controllers so they only parse requests, call services, and return responses.
* **Expand Testing**: Aim for 80% test coverage on service files.
* **Add Telemetry**: Setup basic error logging (Pino/Winston) and APM (Sentry) to catch exceptions before users report them.

---

## 3. Concrete Refactor Example

Here is a quick before-and-after comparison of a lead status update handler.

### ❌ The Legacy Way (Insecure, inline queries, no transactions)
```typescript
// src/app/api/leads/[id]/route.ts (Legacy version)
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Insecure: Instantiating client inline, potentially leaking connections on hot-reloads
const prisma = new PrismaClient(); 

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { status, userId } = body; // Unvalidated input

    // Insecure: Bypasses access control check for the logged-in user session
    // Vulnerability: Any client can assign or change status of any lead
    const updatedLead = await prisma.lead.update({
      where: { id: params.id },
      data: { status, assignedToId: userId }
    });

    // Fragile: Audit log is created outside a transaction. 
    // If this call fails, the lead state is updated but the audit history is lost forever.
    await prisma.activityLog.create({
      data: {
        leadId: params.id,
        action: "status_change",
        newValue: status,
      }
    });

    return NextResponse.json(updatedLead);
  } catch (error: any) {
    // Exposes internal database error details to the public client
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

###  The Refactored Way (Validated, transactional, clean separation)
```typescript
// src/services/lead.service.ts (Refactored Service Layer)
import prisma from "@/lib/prisma";
import { leadStatusSchema } from "@/lib/validations";

export class LeadService {
  static async updateStatus(leadId: string, status: string, actorId: string) {
    // 1. Enforce payload schema validation
    const parsed = leadStatusSchema.parse({ status });

    // 2. Perform state mutation & audit logging inside an atomic transaction
    return await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({
        where: { id: leadId },
      });

      if (!lead) throw new Error("Lead not found");

      const updatedLead = await tx.lead.update({
        where: { id: leadId },
        data: { status: parsed.status },
      });

      await tx.activityLog.create({
        data: {
          leadId,
          actorId,
          action: "status_change",
          previousValue: lead.status,
          newValue: parsed.status,
        },
      });

      return updatedLead;
    });
  }
}

// src/app/api/leads/[id]/route.ts (Clean API Controller)
import { NextRequest, NextResponse } from "next/server";
import { LeadService } from "@/services/lead.service";
import { requireLeadAccess } from "@/lib/permissions";
import { ZodError } from "zod";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // 1. Session verification & access boundary guard
    const session = await requireLeadAccess(id, "update");
    
    const body = await req.json();
    const updatedLead = await LeadService.updateStatus(id, body.status, session.user.id);
    
    return NextResponse.json(updatedLead, { status: 200 });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    if (error.message === "Lead not found" || error.status === 404) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    if (error.status === 403) {
      return NextResponse.json({ error: "Forbidden access to this lead" }, { status: 403 });
    }
    // Generic production-safe logging to avoid exposing database stack traces
    console.error("PATCH /api/leads/[id] failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

---

## 4. Setting Standards & Getting Team Buy-in

Establishing standards is easy; getting a busy, resistant team to follow them is the hard part.

### Core Standards I'd Introduce
1. **Strict Type Safety**: Avoid using `any` and turn on strict null checks.
2. **Transaction Safety**: Any database action that updates state and logs history must be grouped in a transaction.
3. **No Direct DB Calls**: Frontend components should never import Prisma or database clients directly.
4. **Test What You Touch**: Every new feature or bug fix must come with corresponding tests.

### Getting the Team on Board
* **Automate, Don't Argue**: Instead of having debates in pull requests, set up pre-commit hooks (`husky` + `lint-staged`) to format and run lints automatically.
* **Show the Time-Saving**: Show them how running the local test suite finds regressions in milliseconds, saving them from waiting on manual QA feedback.
* **The Boy Scout Rule**: Don't force them to rewrite old modules. The rule is simple: just leave the code you touch slightly cleaner than you found it.
