/**
 * Tests for admin vendor management and freelancer procedures.
 * Uses an in-memory mock context to avoid needing a live database.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./_core/context";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type AdminUser = NonNullable<TrpcContext["admin"]>;

function createAdminContext(): TrpcContext {
  const admin: AdminUser = {
    id: 1,
    email: "admin@lingora.com",
    name: "Test Admin",
    role: "super_admin",
  };
  return {
    user: null,
    admin,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    admin: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ---------------------------------------------------------------------------
// Mock the database helpers so tests don't need a live DB
// ---------------------------------------------------------------------------
vi.mock("./db", async () => {
  const sampleFreelancer = {
    id: 42,
    name: "Jane Translator",
    email: "jane@example.com",
    phone: null,
    country: "Egypt",
    services: ["Translation"],
    sourceLanguages: ["English"],
    targetLanguages: ["Arabic"],
    areasOfExpertise: null,
    catTools: null,
    authoringTools: null,
    rates: null,
    linkedinUrl: null,
    prozUrl: null,
    paymentMethod: "payoneer" as const,
    payoneerEmail: "jane@payoneer.com",
    bankName: null,
    bankAccountName: null,
    bankAccountNumber: null,
    bankSwiftCode: null,
    bankIban: null,
    bankCountry: null,
    cvFileKey: null,
    cvFileUrl: null,
    cvFileName: null,
    portfolioFiles: null,
    status: "active" as const,
    tier: "tier2" as const,
    adminNotes: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  };

  const samplePO = {
    id: 1,
    poNumber: "PO-2025-001",
    freelancerId: 42,
    projectName: "Course Localization",
    serviceType: "Translation",
    description: "Translate 10 modules",
    currency: "USD",
    totalAmount: "500.00",
    dueDate: new Date("2025-03-01"),
    status: "sent" as const,
    adminNote: null,
    freelancerNote: null,
    createdAt: new Date("2025-01-15"),
    updatedAt: new Date("2025-01-15"),
  };

  const sampleInvoice = {
    id: 1,
    freelancerId: 42,
    poId: 1,
    poNumber: "PO-2025-001",
    serviceDescription: "Translation services",
    currency: "USD",
    totalAmount: "500.00",
    status: "submitted" as const,
    dueDate: new Date("2025-04-01"),
    adminNote: null,
    invoiceFileKey: null,
    invoiceFileUrl: null,
    paidAt: null,
    createdAt: new Date("2025-02-01"),
    updatedAt: new Date("2025-02-01"),
  };

  return {
    listFreelancers: vi.fn().mockResolvedValue([sampleFreelancer]),
    getFreelancerById: vi.fn().mockResolvedValue(sampleFreelancer),
    getFreelancerByEmail: vi.fn().mockResolvedValue(null),
    updateFreelancer: vi.fn().mockResolvedValue(undefined),
    addFreelancerNote: vi.fn().mockResolvedValue(undefined),
    getFreelancerNotes: vi.fn().mockResolvedValue([]),
    createFreelancer: vi.fn().mockResolvedValue({ id: 99 }),
    listPOs: vi.fn().mockResolvedValue([samplePO]),
    getPOById: vi.fn().mockResolvedValue(samplePO),
    updatePO: vi.fn().mockResolvedValue(undefined),
    createPO: vi.fn().mockResolvedValue({ id: 2, poNumber: "PO-2025-002" }),
    getNextPoNumber: vi.fn().mockResolvedValue("PO-2025-002"),
    listInvoices: vi.fn().mockResolvedValue([sampleInvoice]),
    getInvoiceById: vi.fn().mockResolvedValue(sampleInvoice),
    updateInvoice: vi.fn().mockResolvedValue(undefined),
    createInvoice: vi.fn().mockResolvedValue({ id: 2 }),
    addAuditEntry: vi.fn().mockResolvedValue(undefined),
    listAuditEntries: vi.fn().mockResolvedValue([]),
    logEmail: vi.fn().mockResolvedValue(undefined),
    getEmailLogsByFreelancer: vi.fn().mockResolvedValue([]),
    listEmailTemplates: vi.fn().mockResolvedValue([]),
    createEmailTemplate: vi.fn().mockResolvedValue({ id: 1 }),
    deleteEmailTemplate: vi.fn().mockResolvedValue(undefined),
    getDashboardStats: vi.fn().mockResolvedValue({
      totalVendors: 1,
      activeVendors: 1,
      pendingApprovals: 0,
      openPOs: 1,
      unpaidInvoices: 1,
      tierBreakdown: { tier1: 0, tier2: 1, tier3: 0 },
    }),
    getDb: vi.fn(),
    upsertUser: vi.fn(),
    getUserByOpenId: vi.fn(),
    createAdminAccount: vi.fn(),
    getAdminByEmail: vi.fn(),
    listAdmins: vi.fn(),
    updateAdminAccount: vi.fn(),
    deleteAdminAccount: vi.fn(),
    createAdminSession: vi.fn(),
    getAdminSession: vi.fn(),
    deleteAdminSession: vi.fn(),
  };
});

// Mock email helper
vi.mock("./email", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
  buildApprovalEmail: vi.fn().mockReturnValue("<p>Approved</p>"),
  buildRejectionEmail: vi.fn().mockReturnValue("<p>Rejected</p>"),
  buildNewSignupEmail: vi.fn().mockReturnValue("<p>New signup</p>"),
  buildPOEmail: vi.fn().mockReturnValue("<p>PO</p>"),
}));

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "test-key", url: "/manus-storage/test-key" }),
}));

// ---------------------------------------------------------------------------
// Import router after mocks are set up
// ---------------------------------------------------------------------------
const { appRouter } = await import("./routers");

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("admin.listVendors", () => {
  it("returns vendor list for authenticated admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.listVendors({});
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("name");
    expect(result[0]).toHaveProperty("email");
  });

  it("filters by status when provided", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.listVendors({ status: "active" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("throws UNAUTHORIZED for unauthenticated requests", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.listVendors({})).rejects.toThrow(TRPCError);
  });
});

describe("admin.getVendor", () => {
  it("returns a vendor by ID for authenticated admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.getVendor({ id: 42 });
    expect(result).toHaveProperty("id", 42);
    expect(result).toHaveProperty("email", "jane@example.com");
  });
});

describe("admin.updateVendorStatus", () => {
  it("updates vendor status and returns success", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.updateVendorStatus({ id: 42, status: "active" });
    expect(result).toHaveProperty("success", true);
  });
});

describe("admin.stats", () => {
  it("returns dashboard statistics", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.stats();
    expect(result).toHaveProperty("totalVendors");
    expect(result).toHaveProperty("activeVendors");
    expect(result).toHaveProperty("openPOs");
    expect(result).toHaveProperty("unpaidInvoices");
  });
});

describe("po.list (admin)", () => {
  it("returns PO list for authenticated admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.po.list({});
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty("poNumber");
  });
});

describe("po.getMyPOs (freelancer)", () => {
  it("returns POs for a given freelancer ID", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.po.getMyPOs({ freelancerId: 42 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("invoice.list (admin)", () => {
  it("returns invoice list for authenticated admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.invoice.list({});
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty("currency");
    expect(result[0]).toHaveProperty("totalAmount");
  });
});

describe("invoice.getMyInvoices (freelancer)", () => {
  it("returns invoices for a given freelancer ID", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.invoice.getMyInvoices({ freelancerId: 42 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("freelancer.getById", () => {
  it("returns freelancer profile by ID", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.freelancer.getById({ id: 42 });
    expect(result).toHaveProperty("id", 42);
    expect(result).toHaveProperty("name", "Jane Translator");
  });
});
