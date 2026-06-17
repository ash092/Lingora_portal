import {
  boolean,
  decimal,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users (Manus OAuth - freelancers only use this for OAuth login) ──────────

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Admin accounts (vendor_manager and super_admin) ─────────────────────────

export const adminAccounts = mysqlTable("admin_accounts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["vendor_manager", "super_admin"]).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
});

export type AdminAccount = typeof adminAccounts.$inferSelect;
export type InsertAdminAccount = typeof adminAccounts.$inferInsert;

// ─── Admin sessions ───────────────────────────────────────────────────────────

export const adminSessions = mysqlTable("admin_sessions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  adminId: int("adminId").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Freelancer profiles ──────────────────────────────────────────────────────

export const freelancers = mysqlTable("freelancers", {
  id: int("id").autoincrement().primaryKey(),
  // Basic info
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  phone: varchar("phone", { length: 50 }),
  country: varchar("country", { length: 100 }),
  // Services (JSON array of service names)
  services: json("services").$type<string[]>().notNull(),
  // Languages
  sourceLanguages: json("sourceLanguages").$type<string[]>(),
  targetLanguages: json("targetLanguages").$type<string[]>(),
  // Expertise
  areasOfExpertise: json("areasOfExpertise").$type<string[]>(),
  // Tools
  catTools: json("catTools").$type<string[]>(),
  authoringTools: json("authoringTools").$type<string[]>(),
  // Rates: { serviceName: { rate: number, currency: string, unit: string } }
  rates: json("rates").$type<Record<string, { rate: number; currency: string; unit: string }>>(),
  // Profile URLs
  linkedinUrl: text("linkedinUrl"),
  prozUrl: text("prozUrl"),
  // File storage
  cvFileKey: text("cvFileKey"),
  cvFileUrl: text("cvFileUrl"),
  cvFileName: text("cvFileName"),
  portfolioFiles: json("portfolioFiles").$type<Array<{ key: string; url: string; name: string }>>(),
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Freelancer = typeof freelancers.$inferSelect;
export type InsertFreelancer = typeof freelancers.$inferInsert;

// ─── Internal admin notes on freelancers ─────────────────────────────────────

export const freelancerNotes = mysqlTable("freelancer_notes", {
  id: int("id").autoincrement().primaryKey(),
  freelancerId: int("freelancerId").notNull(),
  adminId: int("adminId").notNull(),
  adminName: varchar("adminName", { length: 255 }),
  note: text("note").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Purchase Orders ──────────────────────────────────────────────────────────

export const purchaseOrders = mysqlTable("purchase_orders", {
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
  respondedAt: timestamp("respondedAt"),
});

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = typeof purchaseOrders.$inferInsert;

// ─── Invoices ─────────────────────────────────────────────────────────────────

export const invoices = mysqlTable("invoices", {
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
  dueDate: timestamp("dueDate").notNull(), // net 45 from submission
  invoiceFileKey: text("invoiceFileKey"),
  invoiceFileUrl: text("invoiceFileUrl"),
  invoiceFileName: text("invoiceFileName"),
  status: mysqlEnum("status", ["submitted", "under_review", "approved", "rejected", "paid"]).default("submitted").notNull(),
  adminNote: text("adminNote"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

// ─── Email communications log ─────────────────────────────────────────────────

export const emailLogs = mysqlTable("email_logs", {
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Email templates ──────────────────────────────────────────────────────────

export const emailTemplates = mysqlTable("email_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── In-portal messages (admin ↔ vendor threads) ────────────────────────────

export const messages = mysqlTable("messages", {
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ─── Audit log ────────────────────────────────────────────────────────────────

export const auditLog = mysqlTable("audit_log", {
  id: int("id").autoincrement().primaryKey(),
  actorId: int("actorId").notNull(),
  actorName: varchar("actorName", { length: 255 }),
  actorType: mysqlEnum("actorType", ["admin", "freelancer"]).notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  entityType: varchar("entityType", { length: 100 }),
  entityId: int("entityId"),
  details: json("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
