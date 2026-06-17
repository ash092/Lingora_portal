import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  addAuditEntry,
  addFreelancerNote,
  createAdminAccount,
  deleteAdminAccount,
  getDashboardStats,
  getFreelancerById,
  getFreelancerNotes,
  listAdmins,
  listFreelancers,
  updateAdminAccount,
  updateFreelancer,
} from "../db";
import { sendEmail, buildApprovalEmail } from "../email";
import { adminProcedure, router } from "../_core/trpc";
import bcrypt from "bcryptjs";

export const adminRouter = router({
  // Dashboard stats
  stats: adminProcedure.query(async () => {
    return getDashboardStats();
  }),

  // Vendor database
  listVendors: adminProcedure
    .input(z.object({
      status: z.string().optional(),
      tier: z.string().optional(),
      country: z.string().optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      return listFreelancers(input);
    }),

  getVendor: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const vendor = await getFreelancerById(input.id);
      if (!vendor) throw new TRPCError({ code: "NOT_FOUND" });
      return vendor;
    }),

  updateVendorStatus: adminProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "active", "inactive"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const vendor = await getFreelancerById(input.id);
      if (!vendor) throw new TRPCError({ code: "NOT_FOUND" });
      await updateFreelancer(input.id, { status: input.status });
      if (input.status === "active" || input.status === "inactive") {
        await sendEmail({
          to: vendor.email,
          subject: input.status === "active"
            ? "Your Lingora Vendor Profile Has Been Approved"
            : "Lingora Vendor Profile Status Update",
          html: buildApprovalEmail(vendor.name, input.status),
        });
      }
      await addAuditEntry({
        actorId: ctx.admin.id,
        actorName: ctx.admin.name || "Admin",
        actorType: "admin",
        action: `Updated vendor status to ${input.status}`,
        entityType: "freelancer",
        entityId: input.id,
      });
      return { success: true };
    }),

  updateVendorTier: adminProcedure
    .input(z.object({
      id: z.number(),
      tier: z.enum(["tier1", "tier2", "tier3"]).nullable(),
      tierNote: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await updateFreelancer(input.id, {
        tier: input.tier ?? undefined,
        tierNote: input.tierNote,
      });
      await addAuditEntry({
        actorId: ctx.admin.id,
        actorName: ctx.admin.name || "Admin",
        actorType: "admin",
        action: `Updated vendor tier to ${input.tier ?? "none"}`,
        entityType: "freelancer",
        entityId: input.id,
      });
      return { success: true };
    }),

  // Internal notes
  addNote: adminProcedure
    .input(z.object({
      freelancerId: z.number(),
      note: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      await addFreelancerNote(input.freelancerId, ctx.admin.id, ctx.admin.name || "Admin", input.note);
      await addAuditEntry({
        actorId: ctx.admin.id,
        actorName: ctx.admin.name || "Admin",
        actorType: "admin",
        action: "Added internal note",
        entityType: "freelancer",
        entityId: input.freelancerId,
      });
      return { success: true };
    }),

  getNotes: adminProcedure
    .input(z.object({ freelancerId: z.number() }))
    .query(async ({ input }) => {
      return getFreelancerNotes(input.freelancerId);
    }),

  // Admin account management (super admin only)
  listAdmins: adminProcedure.query(async () => {
    return listAdmins();
  }),

  createAdmin: adminProcedure
    .input(z.object({
      name: z.string(),
      email: z.string().email(),
      password: z.string().min(8),
      role: z.enum(["vendor_manager", "super_admin"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const hashedPassword = await bcrypt.hash(input.password, 12);
      await createAdminAccount({
        name: input.name,
        email: input.email,
        passwordHash: hashedPassword,
        role: input.role,
      });
      await addAuditEntry({
        actorId: ctx.admin.id,
        actorName: ctx.admin.name || "Admin",
        actorType: "admin",
        action: `Created admin account: ${input.email}`,
      });
      return { success: true };
    }),

  updateAdmin: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await updateAdminAccount(id, data);
      await addAuditEntry({
        actorId: ctx.admin.id,
        actorName: ctx.admin.name || "Admin",
        actorType: "admin",
        action: `Updated admin account #${id}`,
      });
      return { success: true };
    }),

  deleteAdmin: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await deleteAdminAccount(input.id);
      await addAuditEntry({
        actorId: ctx.admin.id,
        actorName: ctx.admin.name || "Admin",
        actorType: "admin",
        action: `Deleted admin account #${input.id}`,
      });
      return { success: true };
    }),
});
