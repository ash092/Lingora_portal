import { and, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  adminAccounts,
  adminSessions,
  auditLog,
  emailLogs,
  emailTemplates,
  freelancerNotes,
  freelancers,
  InsertAdminAccount,
  InsertFreelancer,
  InsertInvoice,
  InsertPurchaseOrder,
  invoices,
  messages,
  purchaseOrders,
  users,
  type InsertMessage,
  type InsertUser,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users (OAuth) ────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  (["name", "email", "loginMethod"] as const).forEach((f) => {
    if (user[f] !== undefined) { values[f] = user[f] ?? null; updateSet[f] = user[f] ?? null; }
  });
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── Admin accounts ───────────────────────────────────────────────────────────

export async function createAdminAccount(data: InsertAdminAccount) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(adminAccounts).values(data);
}

export async function getAdminByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(adminAccounts).where(eq(adminAccounts.email, email)).limit(1);
  return result[0];
}

export async function getAdminById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(adminAccounts).where(eq(adminAccounts.id, id)).limit(1);
  return result[0];
}

export async function listAdmins() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(adminAccounts).orderBy(desc(adminAccounts.createdAt));
}

export async function updateAdminAccount(id: number, data: Partial<InsertAdminAccount>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(adminAccounts).set(data).where(eq(adminAccounts.id, id));
}

export async function deleteAdminAccount(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(adminAccounts).where(eq(adminAccounts.id, id));
}

// ─── Admin sessions ───────────────────────────────────────────────────────────

export async function createAdminSession(id: string, adminId: number, expiresAt: Date) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(adminSessions).values({ id, adminId, expiresAt });
}

export async function getAdminSession(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(adminSessions).where(eq(adminSessions.id, id)).limit(1);
  return result[0];
}

export async function deleteAdminSession(id: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(adminSessions).where(eq(adminSessions.id, id));
}

// ─── Freelancers ──────────────────────────────────────────────────────────────

export async function createFreelancer(data: InsertFreelancer) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(freelancers).values(data);
  const result = await db.select().from(freelancers).where(eq(freelancers.email, data.email)).limit(1);
  return result[0];
}

export async function getFreelancerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(freelancers).where(eq(freelancers.id, id)).limit(1);
  return result[0];
}

export async function getFreelancerByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(freelancers).where(eq(freelancers.email, email)).limit(1);
  return result[0];
}

export async function updateFreelancer(id: number, data: Partial<InsertFreelancer>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(freelancers).set({ ...data, updatedAt: new Date() }).where(eq(freelancers.id, id));
}

export async function listFreelancers(filters?: {
  status?: string;
  tier?: string;
  country?: string;
  search?: string;
  filterSourceLanguage?: string;
  filterTargetLanguage?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.status) conditions.push(eq(freelancers.status, filters.status as any));
  if (filters?.tier) conditions.push(eq(freelancers.tier, filters.tier as any));
  if (filters?.country) conditions.push(eq(freelancers.country, filters.country));
  if (filters?.search) {
    conditions.push(or(
      like(freelancers.name, `%${filters.search}%`),
      like(freelancers.email, `%${filters.search}%`)
    ));
  }
  const q = db.select().from(freelancers);
  let results = conditions.length > 0
    ? await (q as any).where(and(...conditions)).orderBy(desc(freelancers.createdAt))
    : await q.orderBy(desc(freelancers.createdAt));

  // Language filtering is done in-memory since languages are stored as JSON arrays
  if (filters?.filterSourceLanguage) {
    const lang = filters.filterSourceLanguage.toLowerCase();
    results = results.filter((f: { sourceLanguages?: string[] | null }) =>
      Array.isArray(f.sourceLanguages) &&
      f.sourceLanguages.some((l: string) => l.toLowerCase() === lang)
    );
  }
  if (filters?.filterTargetLanguage) {
    const lang = filters.filterTargetLanguage.toLowerCase();
    results = results.filter((f: { targetLanguages?: string[] | null }) =>
      Array.isArray(f.targetLanguages) &&
      f.targetLanguages.some((l: string) => l.toLowerCase() === lang)
    );
  }
  return results;
}

// ─── Freelancer notes ─────────────────────────────────────────────────────────

export async function addFreelancerNote(freelancerId: number, adminId: number, adminName: string, note: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(freelancerNotes).values({ freelancerId, adminId, adminName, note });
}

export async function getFreelancerNotes(freelancerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(freelancerNotes).where(eq(freelancerNotes.freelancerId, freelancerId)).orderBy(desc(freelancerNotes.createdAt));
}

// ─── Purchase Orders ──────────────────────────────────────────────────────────

export async function getNextPoNumber(): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const year = new Date().getFullYear();
  const result = await db.select({ count: sql<number>`count(*)` }).from(purchaseOrders)
    .where(like(purchaseOrders.poNumber, `LNG-${year}-%`));
  const count = Number(result[0]?.count ?? 0);
  return `LNG-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function createPO(data: InsertPurchaseOrder) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(purchaseOrders).values(data);
}

export async function getPOById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).limit(1);
  return result[0];
}

export async function listPOs(filters?: { freelancerId?: number; status?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.freelancerId) conditions.push(eq(purchaseOrders.freelancerId, filters.freelancerId));
  if (filters?.status) conditions.push(eq(purchaseOrders.status, filters.status as any));
  const q = db.select().from(purchaseOrders);
  if (conditions.length > 0) {
    return (q as any).where(and(...conditions)).orderBy(desc(purchaseOrders.createdAt));
  }
  return q.orderBy(desc(purchaseOrders.createdAt));
}

export async function updatePO(id: number, data: Partial<InsertPurchaseOrder>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(purchaseOrders).set({ ...data, updatedAt: new Date() }).where(eq(purchaseOrders.id, id));
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

export async function createInvoice(data: InsertInvoice) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(invoices).values(data);
}

export async function getInvoiceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  return result[0];
}

export async function listInvoices(filters?: {
  freelancerId?: number;
  status?: string;
  currency?: string;
  dueSoon?: boolean;
  overdue?: boolean;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.freelancerId) conditions.push(eq(invoices.freelancerId, filters.freelancerId));
  if (filters?.status) conditions.push(eq(invoices.status, filters.status as any));
  if (filters?.currency) conditions.push(eq(invoices.currency, filters.currency as any));
  const now = new Date();
  if (filters?.overdue) {
    conditions.push(lte(invoices.dueDate, now));
    conditions.push(sql`${invoices.status} NOT IN ('paid', 'rejected')`);
  }
  if (filters?.dueSoon) {
    const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    conditions.push(gte(invoices.dueDate, now));
    conditions.push(lte(invoices.dueDate, soon));
    conditions.push(sql`${invoices.status} NOT IN ('paid', 'rejected')`);
  }
  const q = db.select().from(invoices);
  if (conditions.length > 0) {
    return (q as any).where(and(...conditions)).orderBy(desc(invoices.createdAt));
  }
  return q.orderBy(desc(invoices.createdAt));
}

export async function updateInvoice(id: number, data: Partial<InsertInvoice>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(invoices).set({ ...data, updatedAt: new Date() }).where(eq(invoices.id, id));
}

// ─── Email logs ───────────────────────────────────────────────────────────────

export async function logEmail(data: {
  freelancerId?: number;
  adminId: number;
  adminName?: string;
  subject: string;
  body: string;
  recipientEmail: string;
  recipientName?: string;
  status: "sent" | "failed";
  isBatch?: boolean;
  batchId?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(emailLogs).values(data);
}

export async function getEmailLogsByFreelancer(freelancerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailLogs).where(eq(emailLogs.freelancerId, freelancerId)).orderBy(desc(emailLogs.createdAt));
}

// ─── Email templates ──────────────────────────────────────────────────────────

export async function listEmailTemplates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailTemplates).orderBy(desc(emailTemplates.createdAt));
}

export async function createEmailTemplate(data: { name: string; subject: string; body: string; createdBy: number }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(emailTemplates).values(data);
}

export async function updateEmailTemplate(id: number, data: { name?: string; subject?: string; body?: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(emailTemplates).set({ ...data, updatedAt: new Date() }).where(eq(emailTemplates.id, id));
}

export async function deleteEmailTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
}

// ─── Audit log ────────────────────────────────────────────────────────────────

export async function addAuditEntry(data: {
  actorId: number;
  actorName?: string;
  actorType: "admin" | "freelancer";
  action: string;
  entityType?: string;
  entityId?: number;
  details?: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLog).values(data);
}

export async function listAuditLog(limit = 200) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(limit);
}

// ─── Messages ────────────────────────────────────────────────────────────────

export async function createMessage(data: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(messages).values(data);
}

export async function getMessagesByFreelancer(freelancerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages)
    .where(eq(messages.freelancerId, freelancerId))
    .orderBy(messages.createdAt);
}

export async function markMessagesReadByAdmin(freelancerId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(messages)
    .set({ isReadByAdmin: true })
    .where(and(eq(messages.freelancerId, freelancerId), eq(messages.isReadByAdmin, false)));
}

export async function markMessagesReadByVendor(freelancerId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(messages)
    .set({ isReadByVendor: true })
    .where(and(eq(messages.freelancerId, freelancerId), eq(messages.isReadByVendor, false)));
}

export async function getUnreadCountByFreelancer(freelancerId: number, role: "admin" | "vendor") {
  const db = await getDb();
  if (!db) return 0;
  const col = role === "admin" ? messages.isReadByAdmin : messages.isReadByVendor;
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(messages)
    .where(and(eq(messages.freelancerId, freelancerId), eq(col, false)));
  return Number(result[0]?.count ?? 0);
}

export async function getAllConversationSummaries() {
  // Returns one row per freelancer who has at least one message,
  // with the latest message body and unread count for admin
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(messages).orderBy(desc(messages.createdAt));
  const byFreelancer = new Map<number, {
    freelancerId: number;
    latestMessage: string;
    latestAt: Date;
    unreadForAdmin: number;
    unreadForVendor: number;
  }>();
  for (const row of rows) {
    if (!byFreelancer.has(row.freelancerId)) {
      byFreelancer.set(row.freelancerId, {
        freelancerId: row.freelancerId,
        latestMessage: row.body,
        latestAt: row.createdAt,
        unreadForAdmin: 0,
        unreadForVendor: 0,
      });
    }
    const entry = byFreelancer.get(row.freelancerId)!;
    if (!row.isReadByAdmin && row.senderRole === "vendor") entry.unreadForAdmin++;
    if (!row.isReadByVendor && row.senderRole === "admin") entry.unreadForVendor++;
  }
  return Array.from(byFreelancer.values()).sort((a, b) => b.latestAt.getTime() - a.latestAt.getTime());
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;
  const [
    totalVendors,
    activeVendors,
    pendingApprovals,
    tier1,
    tier2,
    tier3,
    openPOs,
    unpaidInvoices,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(freelancers),
    db.select({ count: sql<number>`count(*)` }).from(freelancers).where(eq(freelancers.status, "active")),
    db.select({ count: sql<number>`count(*)` }).from(freelancers).where(eq(freelancers.status, "pending")),
    db.select({ count: sql<number>`count(*)` }).from(freelancers).where(eq(freelancers.tier, "tier1")),
    db.select({ count: sql<number>`count(*)` }).from(freelancers).where(eq(freelancers.tier, "tier2")),
    db.select({ count: sql<number>`count(*)` }).from(freelancers).where(eq(freelancers.tier, "tier3")),
    db.select({ count: sql<number>`count(*)` }).from(purchaseOrders).where(sql`${purchaseOrders.status} IN ('sent', 'accepted')`),
    db.select({ count: sql<number>`count(*)` }).from(invoices).where(sql`${invoices.status} IN ('submitted', 'under_review', 'approved')`),
  ]);
  return {
    totalVendors: Number(totalVendors[0]?.count ?? 0),
    activeVendors: Number(activeVendors[0]?.count ?? 0),
    pendingApprovals: Number(pendingApprovals[0]?.count ?? 0),
    tierBreakdown: {
      tier1: Number(tier1[0]?.count ?? 0),
      tier2: Number(tier2[0]?.count ?? 0),
      tier3: Number(tier3[0]?.count ?? 0),
    },
    openPOs: Number(openPOs[0]?.count ?? 0),
    unpaidInvoices: Number(unpaidInvoices[0]?.count ?? 0),
  };
}
