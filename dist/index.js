var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      // Core
      cookieSecret: process.env.JWT_SECRET ?? "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      isProduction: process.env.NODE_ENV === "production",
      // Admin
      adminSetupKey: process.env.ADMIN_SETUP_KEY ?? "",
      // Resend (email)
      resendApiKey: process.env.RESEND_API_KEY ?? "",
      resendFromEmail: process.env.RESEND_FROM_EMAIL ?? "portal@lingora.tech",
      adminNotificationEmail: process.env.ADMIN_NOTIFICATION_EMAIL ?? "vm@lingoraloc.com",
      // Cloudflare R2 (file storage)
      r2AccountId: process.env.R2_ACCOUNT_ID ?? "",
      r2AccessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
      r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
      r2BucketName: process.env.R2_BUCKET_NAME ?? "",
      r2PublicUrl: process.env.R2_PUBLIC_URL ?? "",
      // App
      appUrl: process.env.APP_URL ?? "",
      // Legacy Manus fields (kept for backward compat, not used in standalone mode)
      appId: process.env.VITE_APP_ID ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
    };
  }
});

// server/email.ts
var email_exports = {};
__export(email_exports, {
  buildApprovalEmail: () => buildApprovalEmail,
  buildInvoiceStatusEmail: () => buildInvoiceStatusEmail,
  buildNewSignupEmail: () => buildNewSignupEmail,
  buildPONotificationEmail: () => buildPONotificationEmail,
  sendEmail: () => sendEmail
});
async function sendEmail(opts) {
  const apiKey = ENV.resendApiKey;
  if (!apiKey) {
    console.warn("[Email] RESEND_API_KEY not set \u2014 email not sent");
    return false;
  }
  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: Array.isArray(opts.to) ? opts.to : [opts.to],
        subject: opts.subject,
        html: opts.html,
        reply_to: opts.replyTo
      })
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[Email] Resend error:", err);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Email] Failed to send:", err);
    return false;
  }
}
function buildNewSignupEmail(freelancerName) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #c0392b; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Lingora Vendor Portal</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #1a1a2e;">New Vendor Registration</h2>
        <p>A new freelancer has registered and is pending review:</p>
        <p><strong>${freelancerName}</strong></p>
        <p>Please log in to the admin portal to review and approve their profile.</p>
        <a href="${ENV.appUrl || "https://vendors.lingoraloc.com"}/admin" 
           style="display: inline-block; background: #c0392b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 16px;">
          Review Profile
        </a>
      </div>
    </div>
  `;
}
function buildApprovalEmail(freelancerName, status) {
  const approved = status === "active";
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #c0392b; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Lingora Vendor Portal</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #1a1a2e;">Profile ${approved ? "Approved" : "Status Update"}</h2>
        <p>Dear ${freelancerName},</p>
        ${approved ? `<p>Your profile has been <strong>approved</strong>. You can now log in to the vendor portal to view and accept purchase orders.</p>` : `<p>Your profile status has been updated to <strong>Inactive</strong>. Please contact us if you have any questions.</p>`}
        <a href="${ENV.appUrl || "https://vendors.lingoraloc.com"}/login" 
           style="display: inline-block; background: #c0392b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 16px;">
          Log In to Portal
        </a>
      </div>
    </div>
  `;
}
function buildPONotificationEmail(freelancerName, po) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #c0392b; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Lingora Vendor Portal</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #1a1a2e;">New Purchase Order</h2>
        <p>Dear ${freelancerName},</p>
        <p>A new purchase order has been issued for you:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">PO Number</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${po.poNumber}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Project</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${po.projectName}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Service</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${po.serviceType}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Total Value</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${po.currency} ${po.totalValue}</td></tr>
          ${po.dueDate ? `<tr><td style="padding: 8px; font-weight: bold;">Due Date</td><td style="padding: 8px;">${new Date(po.dueDate).toLocaleDateString()}</td></tr>` : ""}
        </table>
        <p>Please log in to accept or decline this purchase order.</p>
        <a href="${ENV.appUrl || "https://vendors.lingoraloc.com"}/dashboard/pos" 
           style="display: inline-block; background: #c0392b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 16px;">
          View Purchase Order
        </a>
      </div>
    </div>
  `;
}
function buildInvoiceStatusEmail(freelancerName, invoiceId, status, adminNote) {
  const statusLabels = {
    under_review: "Under Review",
    approved: "Approved",
    rejected: "Rejected",
    paid: "Paid"
  };
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #c0392b; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Lingora Vendor Portal</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #1a1a2e;">Invoice Status Update</h2>
        <p>Dear ${freelancerName},</p>
        <p>Your invoice #${invoiceId} status has been updated to: <strong>${statusLabels[status] || status}</strong></p>
        ${adminNote ? `<p><strong>Note from Lingora:</strong> ${adminNote}</p>` : ""}
        <a href="${ENV.appUrl || "https://vendors.lingoraloc.com"}/dashboard/invoices" 
           style="display: inline-block; background: #c0392b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 16px;">
          View Invoice
        </a>
      </div>
    </div>
  `;
}
var RESEND_API_URL, FROM_EMAIL;
var init_email = __esm({
  "server/email.ts"() {
    "use strict";
    init_env();
    RESEND_API_URL = "https://api.resend.com/emails";
    FROM_EMAIL = ENV.resendFromEmail || "Lingora Portal <portal@lingora.tech>";
  }
});

// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var FREELANCER_COOKIE_NAME = "freelancer_session";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
import { and, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// drizzle/schema.ts
import {
  boolean,
  decimal,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar
} from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var adminAccounts = mysqlTable("admin_accounts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["vendor_manager", "super_admin"]).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn")
});
var adminSessions = mysqlTable("admin_sessions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  adminId: int("adminId").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var freelancers = mysqlTable("freelancers", {
  id: int("id").autoincrement().primaryKey(),
  // Basic info
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  phone: varchar("phone", { length: 50 }),
  country: varchar("country", { length: 100 }),
  // Services (JSON array of service names)
  services: json("services").$type().notNull(),
  // Languages
  sourceLanguages: json("sourceLanguages").$type(),
  targetLanguages: json("targetLanguages").$type(),
  // Expertise
  areasOfExpertise: json("areasOfExpertise").$type(),
  // Tools
  catTools: json("catTools").$type(),
  authoringTools: json("authoringTools").$type(),
  // Rates: { serviceName: { rate: number, currency: string, unit: string } }
  rates: json("rates").$type(),
  // Profile URLs
  linkedinUrl: text("linkedinUrl"),
  prozUrl: text("prozUrl"),
  // File storage
  cvFileKey: text("cvFileKey"),
  cvFileUrl: text("cvFileUrl"),
  cvFileName: text("cvFileName"),
  portfolioFiles: json("portfolioFiles").$type(),
  // Payment info
  paymentMethod: mysqlEnum("paymentMethod", ["payoneer", "bank_transfer"]),
  payoneerEmail: varchar("payoneerEmail", { length: 320 }),
  bankAccountName: varchar("bankAccountName", { length: 255 }),
  bankAccountNumber: varchar("bankAccountNumber", { length: 100 }),
  bankName: varchar("bankName", { length: 255 }),
  bankSwiftCode: varchar("bankSwiftCode", { length: 20 }),
  bankIban: varchar("bankIban", { length: 50 }),
  bankCountry: varchar("bankCountry", { length: 100 }),
  // Status & tier
  status: mysqlEnum("status", ["pending", "active", "inactive"]).default("pending").notNull(),
  tier: mysqlEnum("tier", ["tier1", "tier2", "tier3"]),
  tierNote: text("tierNote"),
  // Password for direct login
  passwordHash: varchar("passwordHash", { length: 255 }),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var freelancerNotes = mysqlTable("freelancer_notes", {
  id: int("id").autoincrement().primaryKey(),
  freelancerId: int("freelancerId").notNull(),
  adminId: int("adminId").notNull(),
  adminName: varchar("adminName", { length: 255 }),
  note: text("note").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var purchaseOrders = mysqlTable("purchase_orders", {
  id: int("id").autoincrement().primaryKey(),
  poNumber: varchar("poNumber", { length: 50 }).notNull().unique(),
  freelancerId: int("freelancerId").notNull(),
  projectName: varchar("projectName", { length: 255 }).notNull(),
  serviceType: varchar("serviceType", { length: 100 }).notNull(),
  languagePair: varchar("languagePair", { length: 100 }),
  description: text("description"),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  rate: decimal("rate", { precision: 10, scale: 4 }).notNull(),
  currency: mysqlEnum("currency", ["USD", "EUR", "EGP"]).notNull().default("USD"),
  totalValue: decimal("totalValue", { precision: 12, scale: 2 }).notNull(),
  dueDate: timestamp("dueDate"),
  status: mysqlEnum("status", ["draft", "sent", "accepted", "declined", "completed", "cancelled"]).default("draft").notNull(),
  freelancerNote: text("freelancerNote"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  sentAt: timestamp("sentAt"),
  respondedAt: timestamp("respondedAt")
});
var invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  freelancerId: int("freelancerId").notNull(),
  poId: int("poId"),
  poNumber: varchar("poNumber", { length: 50 }),
  serviceDescription: text("serviceDescription").notNull(),
  languagePair: varchar("languagePair", { length: 100 }),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  rate: decimal("rate", { precision: 10, scale: 4 }).notNull(),
  currency: mysqlEnum("currency", ["USD", "EUR", "EGP"]).notNull().default("USD"),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  invoiceDate: timestamp("invoiceDate").notNull(),
  dueDate: timestamp("dueDate").notNull(),
  // net 45 from submission
  invoiceFileKey: text("invoiceFileKey"),
  invoiceFileUrl: text("invoiceFileUrl"),
  invoiceFileName: text("invoiceFileName"),
  status: mysqlEnum("status", ["submitted", "under_review", "approved", "rejected", "paid"]).default("submitted").notNull(),
  adminNote: text("adminNote"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var emailLogs = mysqlTable("email_logs", {
  id: int("id").autoincrement().primaryKey(),
  freelancerId: int("freelancerId"),
  adminId: int("adminId").notNull(),
  adminName: varchar("adminName", { length: 255 }),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  recipientName: varchar("recipientName", { length: 255 }),
  status: mysqlEnum("status", ["sent", "failed"]).default("sent").notNull(),
  isBatch: boolean("isBatch").default(false).notNull(),
  batchId: varchar("batchId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var emailTemplates = mysqlTable("email_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  freelancerId: int("freelancerId").notNull(),
  senderRole: mysqlEnum("senderRole", ["admin", "vendor"]).notNull(),
  senderName: varchar("senderName", { length: 255 }),
  body: text("body").notNull(),
  // Optional context references
  poId: int("poId"),
  invoiceId: int("invoiceId"),
  // Read tracking (from the recipient's perspective)
  isReadByAdmin: boolean("isReadByAdmin").default(false).notNull(),
  isReadByVendor: boolean("isReadByVendor").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var auditLog = mysqlTable("audit_log", {
  id: int("id").autoincrement().primaryKey(),
  actorId: int("actorId").notNull(),
  actorName: varchar("actorName", { length: 255 }),
  actorType: mysqlEnum("actorType", ["admin", "freelancer"]).notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  entityType: varchar("entityType", { length: 100 }),
  entityId: int("entityId"),
  details: json("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});

// server/db.ts
var _db = null;
async function getDb() {
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
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values = { openId: user.openId };
  const updateSet = {};
  ["name", "email", "loginMethod"].forEach((f) => {
    if (user[f] !== void 0) {
      values[f] = user[f] ?? null;
      updateSet[f] = user[f] ?? null;
    }
  });
  if (user.lastSignedIn !== void 0) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (!values.lastSignedIn) values.lastSignedIn = /* @__PURE__ */ new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = /* @__PURE__ */ new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}
async function createAdminAccount(data) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(adminAccounts).values(data);
}
async function getAdminByEmail(email) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(adminAccounts).where(eq(adminAccounts.email, email)).limit(1);
  return result[0];
}
async function getAdminById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(adminAccounts).where(eq(adminAccounts.id, id)).limit(1);
  return result[0];
}
async function listAdmins() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(adminAccounts).orderBy(desc(adminAccounts.createdAt));
}
async function updateAdminAccount(id, data) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(adminAccounts).set(data).where(eq(adminAccounts.id, id));
}
async function deleteAdminAccount(id) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(adminAccounts).where(eq(adminAccounts.id, id));
}
async function createFreelancer(data) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(freelancers).values(data);
  const result = await db.select().from(freelancers).where(eq(freelancers.email, data.email)).limit(1);
  return result[0];
}
async function getFreelancerById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(freelancers).where(eq(freelancers.id, id)).limit(1);
  return result[0];
}
async function getFreelancerByEmail(email) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(freelancers).where(eq(freelancers.email, email)).limit(1);
  return result[0];
}
async function updateFreelancer(id, data) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(freelancers).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(freelancers.id, id));
}
async function listFreelancers(filters) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.status) conditions.push(eq(freelancers.status, filters.status));
  if (filters?.tier) conditions.push(eq(freelancers.tier, filters.tier));
  if (filters?.country) conditions.push(eq(freelancers.country, filters.country));
  if (filters?.search) {
    conditions.push(or(
      like(freelancers.name, `%${filters.search}%`),
      like(freelancers.email, `%${filters.search}%`)
    ));
  }
  const q = db.select().from(freelancers);
  let results = conditions.length > 0 ? await q.where(and(...conditions)).orderBy(desc(freelancers.createdAt)) : await q.orderBy(desc(freelancers.createdAt));
  if (filters?.filterSourceLanguage) {
    const lang = filters.filterSourceLanguage.toLowerCase();
    results = results.filter(
      (f) => Array.isArray(f.sourceLanguages) && f.sourceLanguages.some((l) => l.toLowerCase() === lang)
    );
  }
  if (filters?.filterTargetLanguage) {
    const lang = filters.filterTargetLanguage.toLowerCase();
    results = results.filter(
      (f) => Array.isArray(f.targetLanguages) && f.targetLanguages.some((l) => l.toLowerCase() === lang)
    );
  }
  return results;
}
async function addFreelancerNote(freelancerId, adminId, adminName, note) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(freelancerNotes).values({ freelancerId, adminId, adminName, note });
}
async function getFreelancerNotes(freelancerId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(freelancerNotes).where(eq(freelancerNotes.freelancerId, freelancerId)).orderBy(desc(freelancerNotes.createdAt));
}
async function getNextPoNumber() {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  const result = await db.select({ count: sql`count(*)` }).from(purchaseOrders).where(like(purchaseOrders.poNumber, `LNG-${year}-%`));
  const count = Number(result[0]?.count ?? 0);
  return `LNG-${year}-${String(count + 1).padStart(4, "0")}`;
}
async function createPO(data) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(purchaseOrders).values(data);
}
async function getPOById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).limit(1);
  return result[0];
}
async function listPOs(filters) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.freelancerId) conditions.push(eq(purchaseOrders.freelancerId, filters.freelancerId));
  if (filters?.status) conditions.push(eq(purchaseOrders.status, filters.status));
  const q = db.select().from(purchaseOrders);
  if (conditions.length > 0) {
    return q.where(and(...conditions)).orderBy(desc(purchaseOrders.createdAt));
  }
  return q.orderBy(desc(purchaseOrders.createdAt));
}
async function updatePO(id, data) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(purchaseOrders).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(purchaseOrders.id, id));
}
async function createInvoice(data) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(invoices).values(data);
}
async function getInvoiceById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  return result[0];
}
async function listInvoices(filters) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.freelancerId) conditions.push(eq(invoices.freelancerId, filters.freelancerId));
  if (filters?.status) conditions.push(eq(invoices.status, filters.status));
  if (filters?.currency) conditions.push(eq(invoices.currency, filters.currency));
  const now = /* @__PURE__ */ new Date();
  if (filters?.overdue) {
    conditions.push(lte(invoices.dueDate, now));
    conditions.push(sql`${invoices.status} NOT IN ('paid', 'rejected')`);
  }
  if (filters?.dueSoon) {
    const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1e3);
    conditions.push(gte(invoices.dueDate, now));
    conditions.push(lte(invoices.dueDate, soon));
    conditions.push(sql`${invoices.status} NOT IN ('paid', 'rejected')`);
  }
  const q = db.select().from(invoices);
  if (conditions.length > 0) {
    return q.where(and(...conditions)).orderBy(desc(invoices.createdAt));
  }
  return q.orderBy(desc(invoices.createdAt));
}
async function updateInvoice(id, data) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(invoices).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(invoices.id, id));
}
async function logEmail(data) {
  const db = await getDb();
  if (!db) return;
  await db.insert(emailLogs).values(data);
}
async function getEmailLogsByFreelancer(freelancerId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailLogs).where(eq(emailLogs.freelancerId, freelancerId)).orderBy(desc(emailLogs.createdAt));
}
async function listEmailTemplates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailTemplates).orderBy(desc(emailTemplates.createdAt));
}
async function createEmailTemplate(data) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(emailTemplates).values(data);
}
async function updateEmailTemplate(id, data) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(emailTemplates).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(emailTemplates.id, id));
}
async function deleteEmailTemplate(id) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
}
async function addAuditEntry(data) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLog).values(data);
}
async function listAuditLog(limit = 200) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(limit);
}
async function createMessage(data) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(messages).values(data);
}
async function getMessagesByFreelancer(freelancerId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.freelancerId, freelancerId)).orderBy(messages.createdAt);
}
async function markMessagesReadByAdmin(freelancerId) {
  const db = await getDb();
  if (!db) return;
  await db.update(messages).set({ isReadByAdmin: true }).where(and(eq(messages.freelancerId, freelancerId), eq(messages.isReadByAdmin, false)));
}
async function markMessagesReadByVendor(freelancerId) {
  const db = await getDb();
  if (!db) return;
  await db.update(messages).set({ isReadByVendor: true }).where(and(eq(messages.freelancerId, freelancerId), eq(messages.isReadByVendor, false)));
}
async function getAllConversationSummaries() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(messages).orderBy(desc(messages.createdAt));
  const byFreelancer = /* @__PURE__ */ new Map();
  for (const row of rows) {
    if (!byFreelancer.has(row.freelancerId)) {
      byFreelancer.set(row.freelancerId, {
        freelancerId: row.freelancerId,
        latestMessage: row.body,
        latestAt: row.createdAt,
        unreadForAdmin: 0,
        unreadForVendor: 0
      });
    }
    const entry = byFreelancer.get(row.freelancerId);
    if (!row.isReadByAdmin && row.senderRole === "vendor") entry.unreadForAdmin++;
    if (!row.isReadByVendor && row.senderRole === "admin") entry.unreadForVendor++;
  }
  return Array.from(byFreelancer.values()).sort((a, b) => b.latestAt.getTime() - a.latestAt.getTime());
}
async function getDashboardStats() {
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
    unpaidInvoices
  ] = await Promise.all([
    db.select({ count: sql`count(*)` }).from(freelancers),
    db.select({ count: sql`count(*)` }).from(freelancers).where(eq(freelancers.status, "active")),
    db.select({ count: sql`count(*)` }).from(freelancers).where(eq(freelancers.status, "pending")),
    db.select({ count: sql`count(*)` }).from(freelancers).where(eq(freelancers.tier, "tier1")),
    db.select({ count: sql`count(*)` }).from(freelancers).where(eq(freelancers.tier, "tier2")),
    db.select({ count: sql`count(*)` }).from(freelancers).where(eq(freelancers.tier, "tier3")),
    db.select({ count: sql`count(*)` }).from(purchaseOrders).where(sql`${purchaseOrders.status} IN ('sent', 'accepted')`),
    db.select({ count: sql`count(*)` }).from(invoices).where(sql`${invoices.status} IN ('submitted', 'under_review', 'approved')`)
  ]);
  return {
    totalVendors: Number(totalVendors[0]?.count ?? 0),
    activeVendors: Number(activeVendors[0]?.count ?? 0),
    pendingApprovals: Number(pendingApprovals[0]?.count ?? 0),
    tierBreakdown: {
      tier1: Number(tier1[0]?.count ?? 0),
      tier2: Number(tier2[0]?.count ?? 0),
      tier3: Number(tier3[0]?.count ?? 0)
    },
    openPOs: Number(openPOs[0]?.count ?? 0),
    unpaidInvoices: Number(unpaidInvoices[0]?.count ?? 0)
  };
}

// server/routers/freelancer.ts
import { TRPCError as TRPCError2 } from "@trpc/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
init_email();

// server/_core/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

// server/_core/freelancerSession.ts
import { SignJWT, jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";
init_env();
var FREELANCER_JWT_SECRET = () => new TextEncoder().encode(ENV.cookieSecret + "_freelancer");
async function signFreelancerSession(freelancerId, email) {
  const issuedAt = Date.now();
  const expiresInMs = ONE_YEAR_MS;
  const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
  return new SignJWT({ freelancerId, email }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(FREELANCER_JWT_SECRET());
}
async function verifyFreelancerSession(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, FREELANCER_JWT_SECRET(), {
      algorithms: ["HS256"]
    });
    const { freelancerId, email } = payload;
    if (typeof freelancerId !== "number" || typeof email !== "string")
      return null;
    return { freelancerId, email };
  } catch {
    return null;
  }
}
function getFreelancerSessionFromReq(req) {
  const cookies = parseCookieHeader(req.headers.cookie ?? "");
  return cookies[FREELANCER_COOKIE_NAME];
}

// server/_core/trpc.ts
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.admin) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        admin: ctx.admin
      }
    });
  })
);
var freelancerProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    const token = getFreelancerSessionFromReq(ctx.req);
    const session = await verifyFreelancerSession(token);
    if (!session) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    const freelancer = await getFreelancerById(session.freelancerId);
    if (!freelancer || freelancer.status === "inactive") {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        freelancer
      }
    });
  })
);

// server/storage.ts
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 config missing: set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY"
    );
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  });
}
function getBucketName() {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error("R2_BUCKET_NAME env var not set");
  return bucket;
}
function getPublicUrl() {
  return (process.env.R2_PUBLIC_URL || "").replace(/\/+$/, "");
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function appendHashSuffix(relKey) {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const client = getR2Client();
  const bucket = getBucketName();
  const key = appendHashSuffix(normalizeKey(relKey));
  const body = typeof data === "string" ? Buffer.from(data, "utf-8") : Buffer.from(data);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType
    })
  );
  const publicBase = getPublicUrl();
  const url = publicBase ? `${publicBase}/${key}` : `/storage/${key}`;
  return { key, url };
}

// server/routers/freelancer.ts
import { nanoid } from "nanoid";

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// server/routers/freelancer.ts
var rateSchema = z.record(
  z.string(),
  z.object({ rate: z.number(), currency: z.string(), unit: z.string() })
);
var freelancerRouter = router({
  // Public: register
  register: publicProcedure.input(z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8).optional(),
    phone: z.string().optional(),
    country: z.string().optional(),
    services: z.array(z.string()),
    sourceLanguages: z.array(z.string()).optional(),
    targetLanguages: z.array(z.string()).optional(),
    areasOfExpertise: z.array(z.string()).optional(),
    catTools: z.array(z.string()).optional(),
    authoringTools: z.array(z.string()).optional(),
    rates: rateSchema.optional(),
    linkedinUrl: z.string().optional(),
    prozUrl: z.string().optional(),
    paymentMethod: z.enum(["payoneer", "bank_transfer"]).optional(),
    payoneerEmail: z.string().email().optional(),
    bankAccountName: z.string().optional(),
    bankAccountNumber: z.string().optional(),
    bankName: z.string().optional(),
    bankSwiftCode: z.string().optional(),
    bankIban: z.string().optional(),
    bankCountry: z.string().optional(),
    // File uploads as base64
    cvFileBase64: z.string().optional(),
    cvFileName: z.string().optional(),
    portfolioFilesBase64: z.array(z.object({
      base64: z.string(),
      name: z.string()
    })).optional()
  })).mutation(async ({ input }) => {
    const existing = await getFreelancerByEmail(input.email);
    if (existing) {
      throw new TRPCError2({ code: "CONFLICT", message: "A profile with this email already exists." });
    }
    let cvFileKey;
    let cvFileUrl;
    let cvFileName;
    if (input.cvFileBase64 && input.cvFileName) {
      const buffer = Buffer.from(input.cvFileBase64, "base64");
      const key = `cvs/${nanoid()}-${input.cvFileName}`;
      const uploadResult = await storagePut(key, buffer, "application/pdf");
      cvFileKey = key;
      cvFileUrl = uploadResult.url;
      cvFileName = input.cvFileName;
    }
    const portfolioFiles = [];
    for (const pf of input.portfolioFilesBase64 ?? []) {
      const buffer = Buffer.from(pf.base64, "base64");
      const key = `portfolios/${nanoid()}-${pf.name}`;
      const uploadResult2 = await storagePut(key, buffer, "application/pdf");
      portfolioFiles.push({ key, url: uploadResult2.url, name: pf.name });
    }
    let passwordHash;
    if (input.password) {
      passwordHash = await bcrypt.hash(input.password, 12);
    }
    const freelancer = await createFreelancer({
      name: input.name,
      email: input.email,
      passwordHash,
      phone: input.phone,
      country: input.country,
      services: input.services,
      sourceLanguages: input.sourceLanguages,
      targetLanguages: input.targetLanguages,
      areasOfExpertise: input.areasOfExpertise,
      catTools: input.catTools,
      authoringTools: input.authoringTools,
      rates: input.rates,
      linkedinUrl: input.linkedinUrl,
      prozUrl: input.prozUrl,
      paymentMethod: input.paymentMethod,
      payoneerEmail: input.payoneerEmail,
      bankAccountName: input.bankAccountName,
      bankAccountNumber: input.bankAccountNumber,
      bankName: input.bankName,
      bankSwiftCode: input.bankSwiftCode,
      bankIban: input.bankIban,
      bankCountry: input.bankCountry,
      cvFileKey,
      cvFileUrl,
      cvFileName,
      portfolioFiles: portfolioFiles.length > 0 ? portfolioFiles : void 0,
      status: "pending"
    });
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `New Vendor Registration: ${input.name}`,
        html: buildNewSignupEmail(input.name)
      });
    }
    await addAuditEntry({
      actorId: freelancer.id,
      actorName: input.name,
      actorType: "freelancer",
      action: "Registered as new vendor",
      entityType: "freelancer",
      entityId: freelancer.id
    });
    return { success: true, id: freelancer.id };
  }),
  // Get profile by ID
  getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const freelancer = await getFreelancerById(input.id);
    if (!freelancer) throw new TRPCError2({ code: "NOT_FOUND" });
    return freelancer;
  }),
  // Get profile by email
  getByEmail: publicProcedure.input(z.object({ email: z.string().email() })).query(async ({ input }) => {
    const freelancer = await getFreelancerByEmail(input.email);
    if (!freelancer) throw new TRPCError2({ code: "NOT_FOUND" });
    return freelancer;
  }),
  // Update own profile
  updateMyProfile: publicProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    phone: z.string().optional(),
    country: z.string().optional(),
    services: z.array(z.string()).optional(),
    sourceLanguages: z.array(z.string()).optional(),
    targetLanguages: z.array(z.string()).optional(),
    areasOfExpertise: z.array(z.string()).optional(),
    catTools: z.array(z.string()).optional(),
    authoringTools: z.array(z.string()).optional(),
    rates: rateSchema.optional(),
    linkedinUrl: z.string().optional(),
    prozUrl: z.string().optional(),
    paymentMethod: z.enum(["payoneer", "bank_transfer"]).optional(),
    payoneerEmail: z.string().email().optional(),
    bankAccountName: z.string().optional(),
    bankAccountNumber: z.string().optional(),
    bankName: z.string().optional(),
    bankSwiftCode: z.string().optional(),
    bankIban: z.string().optional(),
    bankCountry: z.string().optional(),
    cvFileBase64: z.string().optional(),
    cvFileName: z.string().optional(),
    portfolioFilesBase64: z.array(z.object({
      base64: z.string(),
      name: z.string()
    })).optional()
  })).mutation(async ({ input }) => {
    const { id, cvFileBase64, cvFileName, portfolioFilesBase64, ...data } = input;
    const updateData = { ...data };
    if (cvFileBase64 && cvFileName) {
      const buffer = Buffer.from(cvFileBase64, "base64");
      const key = `cvs/${nanoid()}-${cvFileName}`;
      const cvUpload = await storagePut(key, buffer, "application/pdf");
      updateData.cvFileKey = key;
      updateData.cvFileUrl = cvUpload.url;
      updateData.cvFileName = cvFileName;
    }
    if (portfolioFilesBase64 && portfolioFilesBase64.length > 0) {
      const portfolioFiles = [];
      for (const pf of portfolioFilesBase64) {
        const buffer = Buffer.from(pf.base64, "base64");
        const key = `portfolios/${nanoid()}-${pf.name}`;
        const pfUpload = await storagePut(key, buffer, "application/pdf");
        portfolioFiles.push({ key, url: pfUpload.url, name: pf.name });
      }
      updateData.portfolioFiles = portfolioFiles;
    }
    await updateFreelancer(id, updateData);
    await addAuditEntry({
      actorId: id,
      actorType: "freelancer",
      action: "Updated own profile",
      entityType: "freelancer",
      entityId: id
    });
    return { success: true };
  }),
  // Login with email + password
  login: publicProcedure.input(z.object({
    email: z.string().email(),
    password: z.string()
  })).mutation(async ({ input, ctx }) => {
    const freelancer = await getFreelancerByEmail(input.email.toLowerCase().trim());
    if (!freelancer || !freelancer.passwordHash) {
      throw new TRPCError2({ code: "UNAUTHORIZED", message: "Invalid email or password." });
    }
    const valid = await bcrypt.compare(input.password, freelancer.passwordHash);
    if (!valid) {
      throw new TRPCError2({ code: "UNAUTHORIZED", message: "Invalid email or password." });
    }
    if (freelancer.status === "inactive") {
      throw new TRPCError2({ code: "FORBIDDEN", message: "Your account has been deactivated. Please contact support." });
    }
    const token = await signFreelancerSession(freelancer.id, freelancer.email);
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.cookie(FREELANCER_COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
    return {
      success: true,
      freelancer: {
        id: freelancer.id,
        name: freelancer.name,
        email: freelancer.email,
        status: freelancer.status
      }
    };
  }),
  // Get current freelancer session
  me: publicProcedure.query(async ({ ctx }) => {
    const token = getFreelancerSessionFromReq(ctx.req);
    const session = await verifyFreelancerSession(token);
    if (!session) return null;
    const freelancer = await getFreelancerById(session.freelancerId);
    if (!freelancer) return null;
    return {
      id: freelancer.id,
      name: freelancer.name,
      email: freelancer.email,
      status: freelancer.status,
      tier: freelancer.tier
    };
  }),
  // Logout freelancer
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(FREELANCER_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true };
  })
});

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader2 } from "cookie";
import { SignJWT as SignJWT2, jwtVerify as jwtVerify2 } from "jose";
init_env();
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader2(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT2({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify2(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const intent = getQueryParam(req, "intent");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      const cookieOptions = getSessionCookieOptions(req);
      if (intent === "vendor") {
        const email = userInfo.email?.toLowerCase().trim();
        const name = userInfo.name || "";
        if (!email) {
          const params = new URLSearchParams({ name, google: "1" });
          res.redirect(302, `/register?${params.toString()}`);
          return;
        }
        const existing = await getFreelancerByEmail(email);
        if (existing) {
          if (existing.status === "inactive") {
            res.redirect(302, `/login?error=deactivated`);
            return;
          }
          const token = await signFreelancerSession(existing.id, existing.email);
          res.cookie(FREELANCER_COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
          res.redirect(302, "/dashboard");
        } else {
          const params = new URLSearchParams({ email, name, google: "1" });
          res.redirect(302, `/register?${params.toString()}`);
        }
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/admin");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/storageProxy.ts
init_env();
function registerStorageProxy(app) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

// server/_core/systemRouter.ts
import { z as z2 } from "zod";

// server/_core/notification.ts
init_env();
import { TRPCError as TRPCError3 } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError3({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError3({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError3({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError3({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError3({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError3({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z2.object({
      timestamp: z2.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z2.object({
      title: z2.string().min(1, "title is required"),
      content: z2.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers/admin.ts
import { TRPCError as TRPCError4 } from "@trpc/server";
import { z as z3 } from "zod";
init_email();
import bcrypt2 from "bcryptjs";
var adminRouter = router({
  // Dashboard stats
  stats: adminProcedure.query(async () => {
    return getDashboardStats();
  }),
  // Vendor database
  listVendors: adminProcedure.input(z3.object({
    status: z3.string().optional(),
    tier: z3.string().optional(),
    country: z3.string().optional(),
    search: z3.string().optional()
  }).optional()).query(async ({ input }) => {
    return listFreelancers(input);
  }),
  getVendor: adminProcedure.input(z3.object({ id: z3.number() })).query(async ({ input }) => {
    const vendor = await getFreelancerById(input.id);
    if (!vendor) throw new TRPCError4({ code: "NOT_FOUND" });
    return vendor;
  }),
  updateVendorStatus: adminProcedure.input(z3.object({
    id: z3.number(),
    status: z3.enum(["pending", "active", "inactive"])
  })).mutation(async ({ input, ctx }) => {
    const vendor = await getFreelancerById(input.id);
    if (!vendor) throw new TRPCError4({ code: "NOT_FOUND" });
    await updateFreelancer(input.id, { status: input.status });
    if (input.status === "active" || input.status === "inactive") {
      await sendEmail({
        to: vendor.email,
        subject: input.status === "active" ? "Your Lingora Vendor Profile Has Been Approved" : "Lingora Vendor Profile Status Update",
        html: buildApprovalEmail(vendor.name, input.status)
      });
    }
    await addAuditEntry({
      actorId: ctx.admin.id,
      actorName: ctx.admin.name || "Admin",
      actorType: "admin",
      action: `Updated vendor status to ${input.status}`,
      entityType: "freelancer",
      entityId: input.id
    });
    return { success: true };
  }),
  updateVendorTier: adminProcedure.input(z3.object({
    id: z3.number(),
    tier: z3.enum(["tier1", "tier2", "tier3"]).nullable(),
    tierNote: z3.string().optional()
  })).mutation(async ({ input, ctx }) => {
    await updateFreelancer(input.id, {
      tier: input.tier ?? void 0,
      tierNote: input.tierNote
    });
    await addAuditEntry({
      actorId: ctx.admin.id,
      actorName: ctx.admin.name || "Admin",
      actorType: "admin",
      action: `Updated vendor tier to ${input.tier ?? "none"}`,
      entityType: "freelancer",
      entityId: input.id
    });
    return { success: true };
  }),
  // Internal notes
  addNote: adminProcedure.input(z3.object({
    freelancerId: z3.number(),
    note: z3.string().min(1)
  })).mutation(async ({ input, ctx }) => {
    await addFreelancerNote(input.freelancerId, ctx.admin.id, ctx.admin.name || "Admin", input.note);
    await addAuditEntry({
      actorId: ctx.admin.id,
      actorName: ctx.admin.name || "Admin",
      actorType: "admin",
      action: "Added internal note",
      entityType: "freelancer",
      entityId: input.freelancerId
    });
    return { success: true };
  }),
  getNotes: adminProcedure.input(z3.object({ freelancerId: z3.number() })).query(async ({ input }) => {
    return getFreelancerNotes(input.freelancerId);
  }),
  // Admin account management (super admin only)
  listAdmins: adminProcedure.query(async () => {
    return listAdmins();
  }),
  createAdmin: adminProcedure.input(z3.object({
    name: z3.string(),
    email: z3.string().email(),
    password: z3.string().min(8),
    role: z3.enum(["vendor_manager", "super_admin"])
  })).mutation(async ({ input, ctx }) => {
    const hashedPassword = await bcrypt2.hash(input.password, 12);
    await createAdminAccount({
      name: input.name,
      email: input.email,
      passwordHash: hashedPassword,
      role: input.role
    });
    await addAuditEntry({
      actorId: ctx.admin.id,
      actorName: ctx.admin.name || "Admin",
      actorType: "admin",
      action: `Created admin account: ${input.email}`
    });
    return { success: true };
  }),
  updateAdmin: adminProcedure.input(z3.object({
    id: z3.number(),
    name: z3.string().optional(),
    isActive: z3.boolean().optional()
  })).mutation(async ({ input, ctx }) => {
    const { id, ...data } = input;
    await updateAdminAccount(id, data);
    await addAuditEntry({
      actorId: ctx.admin.id,
      actorName: ctx.admin.name || "Admin",
      actorType: "admin",
      action: `Updated admin account #${id}`
    });
    return { success: true };
  }),
  deleteAdmin: adminProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input, ctx }) => {
    await deleteAdminAccount(input.id);
    await addAuditEntry({
      actorId: ctx.admin.id,
      actorName: ctx.admin.name || "Admin",
      actorType: "admin",
      action: `Deleted admin account #${input.id}`
    });
    return { success: true };
  })
});

// server/routers/adminAuth.ts
import { TRPCError as TRPCError5 } from "@trpc/server";
import { z as z4 } from "zod";
import bcrypt3 from "bcryptjs";

// server/_core/adminSession.ts
import { SignJWT as SignJWT3, jwtVerify as jwtVerify3 } from "jose";
import { parse as parseCookieHeader3 } from "cookie";
init_env();
var ADMIN_COOKIE_NAME = "admin_session";
var ADMIN_JWT_SECRET = () => new TextEncoder().encode(ENV.cookieSecret + "_admin");
async function signAdminSession(adminId, email, role) {
  const issuedAt = Date.now();
  const expiresInMs = ONE_YEAR_MS;
  const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
  return new SignJWT3({ adminId, email, role }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(ADMIN_JWT_SECRET());
}
async function verifyAdminSession(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify3(token, ADMIN_JWT_SECRET(), {
      algorithms: ["HS256"]
    });
    const { adminId, email, role } = payload;
    if (typeof adminId !== "number" || typeof email !== "string" || typeof role !== "string")
      return null;
    return { adminId, email, role };
  } catch {
    return null;
  }
}
function getAdminSessionFromReq(req) {
  const cookies = parseCookieHeader3(req.headers.cookie ?? "");
  return cookies[ADMIN_COOKIE_NAME];
}

// server/routers/adminAuth.ts
var ADMIN_SESSION_MAX_AGE = 365 * 24 * 60 * 60;
function setAdminCookie(res, token) {
  res.cookie(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ADMIN_SESSION_MAX_AGE * 1e3,
    path: "/"
  });
}
var adminAuthRouter = router({
  // ── Login ──────────────────────────────────────────────────────────────────
  login: publicProcedure.input(z4.object({
    email: z4.string().email(),
    password: z4.string().min(1)
  })).mutation(async ({ input, ctx }) => {
    const admin = await getAdminByEmail(input.email);
    if (!admin || !admin.isActive) {
      throw new TRPCError5({
        code: "UNAUTHORIZED",
        message: "Invalid email or password"
      });
    }
    const valid = await bcrypt3.compare(input.password, admin.passwordHash);
    if (!valid) {
      throw new TRPCError5({
        code: "UNAUTHORIZED",
        message: "Invalid email or password"
      });
    }
    await updateAdminAccount(admin.id, { lastSignedIn: /* @__PURE__ */ new Date() });
    const token = await signAdminSession(admin.id, admin.email, admin.role);
    setAdminCookie(ctx.res, token);
    return {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role
    };
  }),
  // ── Current admin ──────────────────────────────────────────────────────────
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.admin) return null;
    return {
      id: ctx.admin.id,
      name: ctx.admin.name,
      email: ctx.admin.email,
      role: ctx.admin.role
    };
  }),
  // ── Logout ─────────────────────────────────────────────────────────────────
  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie(ADMIN_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/"
    });
    return { success: true };
  }),
  // ── First-run setup: create initial super admin ────────────────────────────
  // Only works when there are zero admin accounts in the database.
  setup: publicProcedure.input(z4.object({
    name: z4.string().min(1),
    email: z4.string().email(),
    password: z4.string().min(8),
    setupKey: z4.string()
    // Must match ADMIN_SETUP_KEY env var
  })).mutation(async ({ input, ctx }) => {
    const setupKey = process.env.ADMIN_SETUP_KEY;
    if (!setupKey || input.setupKey !== setupKey) {
      throw new TRPCError5({
        code: "FORBIDDEN",
        message: "Invalid setup key"
      });
    }
    const existing = await listAdmins();
    if (existing.length > 0) {
      throw new TRPCError5({
        code: "FORBIDDEN",
        message: "Admin accounts already exist. Use the admin panel to create more."
      });
    }
    const passwordHash = await bcrypt3.hash(input.password, 12);
    await createAdminAccount({
      name: input.name,
      email: input.email,
      passwordHash,
      role: "super_admin"
    });
    const admin = await getAdminByEmail(input.email);
    if (admin) {
      const token = await signAdminSession(admin.id, admin.email, admin.role);
      setAdminCookie(ctx.res, token);
    }
    return { success: true };
  }),
  // ── Change own password ────────────────────────────────────────────────────
  changePassword: adminProcedure.input(z4.object({
    currentPassword: z4.string(),
    newPassword: z4.string().min(8)
  })).mutation(async ({ input, ctx }) => {
    const admin = await getAdminById(ctx.admin.id);
    if (!admin) throw new TRPCError5({ code: "NOT_FOUND" });
    const valid = await bcrypt3.compare(input.currentPassword, admin.passwordHash);
    if (!valid) {
      throw new TRPCError5({
        code: "UNAUTHORIZED",
        message: "Current password is incorrect"
      });
    }
    const newHash = await bcrypt3.hash(input.newPassword, 12);
    await updateAdminAccount(ctx.admin.id, { passwordHash: newHash });
    return { success: true };
  })
});

// server/routers/email.ts
import { z as z5 } from "zod";
init_email();
import { nanoid as nanoid2 } from "nanoid";
var emailRouter = router({
  listTemplates: adminProcedure.query(async () => {
    return listEmailTemplates();
  }),
  createTemplate: adminProcedure.input(z5.object({
    name: z5.string().min(1),
    subject: z5.string().min(1),
    body: z5.string().min(1)
  })).mutation(async ({ input, ctx }) => {
    await createEmailTemplate({ ...input, createdBy: ctx.admin.id });
    return { success: true };
  }),
  updateTemplate: adminProcedure.input(z5.object({
    id: z5.number(),
    name: z5.string().optional(),
    subject: z5.string().optional(),
    body: z5.string().optional()
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await updateEmailTemplate(id, data);
    return { success: true };
  }),
  deleteTemplate: adminProcedure.input(z5.object({ id: z5.number() })).mutation(async ({ input }) => {
    await deleteEmailTemplate(input.id);
    return { success: true };
  }),
  // Returns the list of vendors that match the current filters (for live preview)
  previewRecipients: adminProcedure.input(z5.object({
    filterStatus: z5.string().optional(),
    filterTier: z5.string().optional(),
    filterCountry: z5.string().optional(),
    filterSourceLanguage: z5.string().optional(),
    filterTargetLanguage: z5.string().optional()
  })).query(async ({ input }) => {
    const vendors = await listFreelancers({
      status: input.filterStatus || "active",
      tier: input.filterTier,
      country: input.filterCountry,
      filterSourceLanguage: input.filterSourceLanguage,
      filterTargetLanguage: input.filterTargetLanguage
    });
    return vendors.map((v) => ({
      id: v.id,
      name: v.name,
      email: v.email,
      tier: v.tier,
      sourceLanguages: v.sourceLanguages,
      targetLanguages: v.targetLanguages
    }));
  }),
  send: adminProcedure.input(z5.object({
    subject: z5.string().min(1),
    body: z5.string().min(1),
    recipientIds: z5.array(z5.number()).optional(),
    filterStatus: z5.string().optional(),
    filterTier: z5.string().optional(),
    filterCountry: z5.string().optional(),
    filterSourceLanguage: z5.string().optional(),
    filterTargetLanguage: z5.string().optional()
  })).mutation(async ({ input, ctx }) => {
    const batchId = nanoid2();
    const allVendors = await listFreelancers({
      status: input.filterStatus || "active",
      tier: input.filterTier,
      country: input.filterCountry,
      filterSourceLanguage: input.filterSourceLanguage,
      filterTargetLanguage: input.filterTargetLanguage
    });
    const recipients = input.recipientIds && input.recipientIds.length > 0 ? allVendors.filter((f) => input.recipientIds.includes(f.id)) : allVendors;
    const isBatch = recipients.length > 1;
    let sentCount = 0;
    let failedCount = 0;
    for (const recipient of recipients) {
      const personalizedBody = input.body.replace(/\{\{name\}\}/g, recipient.name);
      const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #c0392b; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Lingora Vendor Portal</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              ${personalizedBody.replace(/\n/g, "<br>")}
            </div>
            <div style="padding: 16px; background: #1a1a2e; text-align: center;">
              <p style="color: #888; margin: 0; font-size: 12px;">Lingora Localization & EdTech Content | lingoraloc.com</p>
            </div>
          </div>
        `;
      const ok = await sendEmail({ to: recipient.email, subject: input.subject, html });
      await logEmail({
        freelancerId: recipient.id,
        adminId: ctx.admin.id,
        adminName: ctx.admin.name || "Admin",
        subject: input.subject,
        body: personalizedBody,
        recipientEmail: recipient.email,
        recipientName: recipient.name,
        status: ok ? "sent" : "failed",
        isBatch,
        batchId
      });
      if (ok) sentCount++;
      else failedCount++;
    }
    await addAuditEntry({
      actorId: ctx.admin.id,
      actorName: ctx.admin.name || "Admin",
      actorType: "admin",
      action: `Sent batch email to ${sentCount} recipients (${failedCount} failed)`
    });
    return { success: true, sentCount, failedCount, total: recipients.length };
  }),
  getLog: adminProcedure.input(z5.object({ freelancerId: z5.number() })).query(async ({ input }) => {
    return getEmailLogsByFreelancer(input.freelancerId);
  })
});

// server/routers/invoice.ts
import { TRPCError as TRPCError6 } from "@trpc/server";
import { z as z6 } from "zod";
init_email();
import { nanoid as nanoid3 } from "nanoid";
var NET_45_DAYS = 45;
var invoiceRouter = router({
  // Freelancer: submit invoice
  submit: publicProcedure.input(z6.object({
    freelancerId: z6.number(),
    poId: z6.number().optional(),
    poNumber: z6.string().optional(),
    serviceDescription: z6.string().min(1),
    languagePair: z6.string().optional(),
    quantity: z6.string(),
    unit: z6.string(),
    rate: z6.string(),
    currency: z6.enum(["USD", "EUR", "EGP"]),
    totalAmount: z6.string(),
    invoiceDate: z6.string(),
    invoiceFileBase64: z6.string(),
    invoiceFileName: z6.string()
  })).mutation(async ({ input }) => {
    const freelancer = await getFreelancerById(input.freelancerId);
    if (!freelancer) throw new TRPCError6({ code: "NOT_FOUND" });
    const buffer = Buffer.from(input.invoiceFileBase64, "base64");
    const key = `invoices/${nanoid3()}-${input.invoiceFileName}`;
    const { url } = await storagePut(key, buffer, "application/pdf");
    const submittedAt = /* @__PURE__ */ new Date();
    const dueDate = new Date(submittedAt.getTime() + NET_45_DAYS * 24 * 60 * 60 * 1e3);
    await createInvoice({
      freelancerId: input.freelancerId,
      poId: input.poId,
      poNumber: input.poNumber,
      serviceDescription: input.serviceDescription,
      languagePair: input.languagePair,
      quantity: input.quantity,
      unit: input.unit,
      rate: input.rate,
      currency: input.currency,
      totalAmount: input.totalAmount,
      invoiceDate: new Date(input.invoiceDate),
      dueDate,
      invoiceFileKey: key,
      invoiceFileUrl: url,
      invoiceFileName: input.invoiceFileName,
      status: "submitted"
    });
    await addAuditEntry({
      actorId: input.freelancerId,
      actorType: "freelancer",
      action: `Submitted invoice for ${input.serviceDescription}`,
      entityType: "invoice"
    });
    return { success: true };
  }),
  // Freelancer: get own invoices
  getMyInvoices: publicProcedure.input(z6.object({
    freelancerId: z6.number(),
    status: z6.string().optional()
  })).query(async ({ input }) => {
    return listInvoices({ freelancerId: input.freelancerId, status: input.status });
  }),
  // Admin: list all invoices
  list: adminProcedure.input(z6.object({
    freelancerId: z6.number().optional(),
    status: z6.string().optional(),
    currency: z6.string().optional(),
    dueSoon: z6.boolean().optional(),
    overdue: z6.boolean().optional()
  }).optional()).query(async ({ input }) => {
    return listInvoices(input);
  }),
  // Admin: get single invoice
  getById: adminProcedure.input(z6.object({ id: z6.number() })).query(async ({ input }) => {
    const inv = await getInvoiceById(input.id);
    if (!inv) throw new TRPCError6({ code: "NOT_FOUND" });
    return inv;
  }),
  // Admin: update invoice status
  updateStatus: adminProcedure.input(z6.object({
    id: z6.number(),
    status: z6.enum(["under_review", "approved", "rejected", "paid"]),
    adminNote: z6.string().optional(),
    paidAt: z6.string().optional()
  })).mutation(async ({ input, ctx }) => {
    const inv = await getInvoiceById(input.id);
    if (!inv) throw new TRPCError6({ code: "NOT_FOUND" });
    const updateData = {
      status: input.status,
      adminNote: input.adminNote
    };
    if (input.status === "paid" && input.paidAt) {
      updateData.paidAt = new Date(input.paidAt);
    }
    await updateInvoice(input.id, updateData);
    const freelancer = await getFreelancerById(inv.freelancerId);
    if (freelancer) {
      await sendEmail({
        to: freelancer.email,
        subject: `Invoice Status Update`,
        html: buildInvoiceStatusEmail(freelancer.name, inv.id, input.status, input.adminNote)
      });
    }
    await addAuditEntry({
      actorId: ctx.admin.id,
      actorName: ctx.admin.name || "Admin",
      actorType: "admin",
      action: `Updated invoice #${inv.id} status to ${input.status}`,
      entityType: "invoice",
      entityId: input.id
    });
    return { success: true };
  })
});

// server/routers/po.ts
import { TRPCError as TRPCError7 } from "@trpc/server";
import { z as z7 } from "zod";
init_email();
var poRouter = router({
  // Admin: create and send PO
  create: adminProcedure.input(z7.object({
    freelancerId: z7.number(),
    projectName: z7.string().min(1),
    serviceType: z7.string().min(1),
    languagePair: z7.string().optional(),
    description: z7.string().optional(),
    quantity: z7.string(),
    unit: z7.string(),
    rate: z7.string(),
    totalValue: z7.string(),
    currency: z7.enum(["USD", "EUR", "EGP"]),
    dueDate: z7.string().optional(),
    freelancerNote: z7.string().optional()
  })).mutation(async ({ input, ctx }) => {
    const freelancer = await getFreelancerById(input.freelancerId);
    if (!freelancer) throw new TRPCError7({ code: "NOT_FOUND", message: "Freelancer not found" });
    if (freelancer.status !== "active") {
      throw new TRPCError7({ code: "BAD_REQUEST", message: "Cannot issue PO to inactive vendor" });
    }
    const poNumber = await getNextPoNumber();
    await createPO({
      poNumber,
      freelancerId: input.freelancerId,
      createdBy: ctx.admin.id,
      projectName: input.projectName,
      serviceType: input.serviceType,
      languagePair: input.languagePair,
      description: input.description,
      quantity: input.quantity,
      unit: input.unit,
      rate: input.rate,
      totalValue: input.totalValue,
      currency: input.currency,
      dueDate: input.dueDate ? new Date(input.dueDate) : void 0,
      freelancerNote: input.freelancerNote,
      status: "sent",
      sentAt: /* @__PURE__ */ new Date()
    });
    await sendEmail({
      to: freelancer.email,
      subject: `New Purchase Order ${poNumber} from Lingora`,
      html: buildPONotificationEmail(freelancer.name, {
        poNumber,
        projectName: input.projectName,
        serviceType: input.serviceType,
        totalValue: input.totalValue,
        currency: input.currency,
        dueDate: input.dueDate ? new Date(input.dueDate) : null
      })
    });
    await addAuditEntry({
      actorId: ctx.admin.id,
      actorName: ctx.admin.name || "Admin",
      actorType: "admin",
      action: `Created PO ${poNumber} for vendor #${input.freelancerId}`,
      entityType: "purchase_order"
    });
    return { success: true, poNumber };
  }),
  // Admin: list all POs
  list: adminProcedure.input(z7.object({
    freelancerId: z7.number().optional(),
    status: z7.string().optional()
  }).optional()).query(async ({ input }) => {
    return listPOs(input);
  }),
  // Admin: get single PO
  getById: adminProcedure.input(z7.object({ id: z7.number() })).query(async ({ input }) => {
    const po = await getPOById(input.id);
    if (!po) throw new TRPCError7({ code: "NOT_FOUND" });
    return po;
  }),
  // Admin: cancel PO
  cancel: adminProcedure.input(z7.object({ id: z7.number() })).mutation(async ({ input, ctx }) => {
    const po = await getPOById(input.id);
    if (!po) throw new TRPCError7({ code: "NOT_FOUND" });
    await updatePO(input.id, { status: "cancelled" });
    await addAuditEntry({
      actorId: ctx.admin.id,
      actorName: ctx.admin.name || "Admin",
      actorType: "admin",
      action: `Cancelled PO ${po.poNumber}`,
      entityType: "purchase_order",
      entityId: input.id
    });
    return { success: true };
  }),
  // Freelancer: get own POs
  getMyPOs: publicProcedure.input(z7.object({ freelancerId: z7.number(), status: z7.string().optional() })).query(async ({ input }) => {
    return listPOs({ freelancerId: input.freelancerId, status: input.status });
  }),
  // Freelancer: accept or decline PO
  respond: publicProcedure.input(z7.object({
    id: z7.number(),
    freelancerId: z7.number(),
    action: z7.enum(["accept", "decline"]),
    declineReason: z7.string().optional()
  })).mutation(async ({ input }) => {
    const po = await getPOById(input.id);
    if (!po) throw new TRPCError7({ code: "NOT_FOUND" });
    if (po.freelancerId !== input.freelancerId) throw new TRPCError7({ code: "FORBIDDEN" });
    if (po.status !== "sent") throw new TRPCError7({ code: "BAD_REQUEST", message: "PO is no longer pending response" });
    const newStatus = input.action === "accept" ? "accepted" : "declined";
    await updatePO(input.id, {
      status: newStatus,
      freelancerNote: input.action === "decline" ? input.declineReason : void 0,
      respondedAt: /* @__PURE__ */ new Date()
    });
    await addAuditEntry({
      actorId: input.freelancerId,
      actorType: "freelancer",
      action: `${input.action === "accept" ? "Accepted" : "Declined"} PO ${po.poNumber}`,
      entityType: "purchase_order",
      entityId: input.id
    });
    return { success: true };
  })
});

// server/routers/messages.ts
import { z as z8 } from "zod";
var ADMIN_NOTIFY_EMAIL = "vm@lingoraloc.com";
var messagesRouter = router({
  // ── Admin: list all conversation threads ──────────────────────────────────
  listConversations: adminProcedure.query(async () => {
    const summaries = await getAllConversationSummaries();
    const enriched = await Promise.all(
      summaries.map(async (s) => {
        const f = await getFreelancerById(s.freelancerId);
        return {
          ...s,
          freelancerName: f?.name ?? "Unknown",
          freelancerEmail: f?.email ?? ""
        };
      })
    );
    return enriched;
  }),
  // ── Admin: get full thread for a vendor ───────────────────────────────────
  getThread: adminProcedure.input(z8.object({ freelancerId: z8.number() })).query(async ({ input }) => {
    await markMessagesReadByAdmin(input.freelancerId);
    return getMessagesByFreelancer(input.freelancerId);
  }),
  // ── Admin: send a message to a vendor ────────────────────────────────────
  adminSend: adminProcedure.input(
    z8.object({
      freelancerId: z8.number(),
      body: z8.string().min(1).max(5e3),
      poId: z8.number().optional(),
      invoiceId: z8.number().optional()
    })
  ).mutation(async ({ input, ctx }) => {
    const freelancer = await getFreelancerById(input.freelancerId);
    if (!freelancer) throw new Error("Vendor not found");
    await createMessage({
      freelancerId: input.freelancerId,
      senderRole: "admin",
      senderName: ctx.admin.name ?? "Lingora Team",
      body: input.body,
      poId: input.poId,
      invoiceId: input.invoiceId,
      isReadByAdmin: true,
      isReadByVendor: false
    });
    try {
      const { sendEmail: sendEmail2 } = await Promise.resolve().then(() => (init_email(), email_exports));
      await sendEmail2({
        to: freelancer.email,
        subject: "New message from Lingora",
        html: `
            <p>Hi ${freelancer.name},</p>
            <p>You have a new message from the Lingora team:</p>
            <blockquote style="border-left:3px solid #ccc;padding-left:12px;color:#555;">
              ${input.body.replace(/\n/g, "<br>")}
            </blockquote>
            <p>Log in to your vendor portal to reply.</p>
          `,
        replyTo: ADMIN_NOTIFY_EMAIL
      });
    } catch (e) {
      console.warn("[messages] Failed to send vendor notification email:", e);
    }
    return { ok: true };
  }),
  // ── Vendor: get own thread ────────────────────────────────────────────────
  vendorGetThread: freelancerProcedure.query(async ({ ctx }) => {
    await markMessagesReadByVendor(ctx.freelancer.id);
    return getMessagesByFreelancer(ctx.freelancer.id);
  }),
  // ── Vendor: send a message ────────────────────────────────────────────────
  vendorSend: freelancerProcedure.input(
    z8.object({
      body: z8.string().min(1).max(5e3),
      poId: z8.number().optional(),
      invoiceId: z8.number().optional()
    })
  ).mutation(async ({ input, ctx }) => {
    await createMessage({
      freelancerId: ctx.freelancer.id,
      senderRole: "vendor",
      senderName: ctx.freelancer.name,
      body: input.body,
      poId: input.poId,
      invoiceId: input.invoiceId,
      isReadByAdmin: false,
      isReadByVendor: true
    });
    try {
      const { sendEmail: sendEmail2 } = await Promise.resolve().then(() => (init_email(), email_exports));
      await sendEmail2({
        to: ADMIN_NOTIFY_EMAIL,
        subject: `New message from vendor: ${ctx.freelancer.name}`,
        html: `
            <p>You have a new message from <strong>${ctx.freelancer.name}</strong> (${ctx.freelancer.email}):</p>
            <blockquote style="border-left:3px solid #ccc;padding-left:12px;color:#555;">
              ${input.body.replace(/\n/g, "<br>")}
            </blockquote>
            <p>Log in to the admin panel to reply.</p>
          `,
        replyTo: ctx.freelancer.email
      });
    } catch (e) {
      console.warn("[messages] Failed to send admin notification email:", e);
    }
    return { ok: true };
  }),
  // ── Vendor: unread count ──────────────────────────────────────────────────
  vendorUnreadCount: freelancerProcedure.query(async ({ ctx }) => {
    const msgs = await getMessagesByFreelancer(ctx.freelancer.id);
    const unread = msgs.filter(
      (m) => m.senderRole === "admin" && !m.isReadByVendor
    ).length;
    return { unread };
  })
});

// server/routers/superAdmin.ts
import { z as z9 } from "zod";
var superAdminRouter = router({
  auditLog: adminProcedure.input(z9.object({ limit: z9.number().min(1).max(500).default(200) }).optional()).query(async ({ input }) => {
    return listAuditLog(input?.limit ?? 200);
  })
});

// server/routers/setup.ts
import { TRPCError as TRPCError8 } from "@trpc/server";
var setupRouter = router({
  initializeDatabase: publicProcedure.mutation(async ({ ctx }) => {
    try {
      return {
        success: true,
        message: "Database setup endpoint ready"
      };
    } catch (error) {
      console.error("Setup error:", error);
      throw new TRPCError8({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to initialize database"
      });
    }
  })
});

// server/routers.ts
var appRouter = router({
  setup: setupRouter,
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  adminAuth: adminAuthRouter,
  admin: adminRouter,
  freelancer: freelancerRouter,
  po: poRouter,
  invoice: invoiceRouter,
  email: emailRouter,
  superAdmin: superAdminRouter,
  messages: messagesRouter
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  let admin = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    user = null;
  }
  try {
    const token = getAdminSessionFromReq(opts.req);
    const session = await verifyAdminSession(token);
    if (session) {
      const account = await getAdminById(session.adminId);
      if (account && account.isActive) {
        admin = account;
      }
    }
  } catch {
    admin = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user,
    admin
  };
}

// server/_core/vite.ts
import express from "express";
import fs2 from "fs";
import { nanoid as nanoid4 } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var PROJECT_ROOT = import.meta.dirname;
var LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
var MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
var TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function trimLogFile(logPath, maxSize) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }
    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines = [];
    let keptBytes = 0;
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}
`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
  }
}
function writeToLogFile(source, entries) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });
  fs.appendFileSync(logPath, `${lines.join("\n")}
`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}
function vitePluginManusDebugCollector() {
  return {
    name: "manus-debug-collector",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true
            },
            injectTo: "head"
          }
        ]
      };
    },
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }
        const handlePayload = (payload) => {
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };
        const reqBody = req.body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    }
  };
}
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid4()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
