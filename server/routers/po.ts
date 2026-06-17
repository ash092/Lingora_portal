import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  addAuditEntry,
  createPO,
  getFreelancerById,
  getNextPoNumber,
  getPOById,
  listPOs,
  updatePO,
} from "../db";
import { sendEmail, buildPONotificationEmail } from "../email";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";

export const poRouter = router({
  // Admin: create and send PO
  create: adminProcedure
    .input(z.object({
      freelancerId: z.number(),
      projectName: z.string().min(1),
      serviceType: z.string().min(1),
      languagePair: z.string().optional(),
      description: z.string().optional(),
      quantity: z.string(),
      unit: z.string(),
      rate: z.string(),
      totalValue: z.string(),
      currency: z.enum(["USD", "EUR", "EGP"]),
      dueDate: z.string().optional(),
      freelancerNote: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const freelancer = await getFreelancerById(input.freelancerId);
      if (!freelancer) throw new TRPCError({ code: "NOT_FOUND", message: "Freelancer not found" });
      if (freelancer.status !== "active") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot issue PO to inactive vendor" });
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
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        freelancerNote: input.freelancerNote,
        status: "sent",
        sentAt: new Date(),
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
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
        }),
      });

      await addAuditEntry({
        actorId: ctx.admin.id,
        actorName: ctx.admin.name || "Admin",
        actorType: "admin",
        action: `Created PO ${poNumber} for vendor #${input.freelancerId}`,
        entityType: "purchase_order",
      });

      return { success: true, poNumber };
    }),

  // Admin: list all POs
  list: adminProcedure
    .input(z.object({
      freelancerId: z.number().optional(),
      status: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      return listPOs(input);
    }),

  // Admin: get single PO
  getById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const po = await getPOById(input.id);
      if (!po) throw new TRPCError({ code: "NOT_FOUND" });
      return po;
    }),

  // Admin: cancel PO
  cancel: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const po = await getPOById(input.id);
      if (!po) throw new TRPCError({ code: "NOT_FOUND" });
      await updatePO(input.id, { status: "cancelled" });
      await addAuditEntry({
        actorId: ctx.admin.id,
        actorName: ctx.admin.name || "Admin",
        actorType: "admin",
        action: `Cancelled PO ${po.poNumber}`,
        entityType: "purchase_order",
        entityId: input.id,
      });
      return { success: true };
    }),

  // Freelancer: get own POs
  getMyPOs: publicProcedure
    .input(z.object({ freelancerId: z.number(), status: z.string().optional() }))
    .query(async ({ input }) => {
      return listPOs({ freelancerId: input.freelancerId, status: input.status });
    }),

  // Freelancer: accept or decline PO
  respond: publicProcedure
    .input(z.object({
      id: z.number(),
      freelancerId: z.number(),
      action: z.enum(["accept", "decline"]),
      declineReason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const po = await getPOById(input.id);
      if (!po) throw new TRPCError({ code: "NOT_FOUND" });
      if (po.freelancerId !== input.freelancerId) throw new TRPCError({ code: "FORBIDDEN" });
      if (po.status !== "sent") throw new TRPCError({ code: "BAD_REQUEST", message: "PO is no longer pending response" });

      const newStatus = input.action === "accept" ? "accepted" : "declined";
      await updatePO(input.id, {
        status: newStatus,
        freelancerNote: input.action === "decline" ? input.declineReason : undefined,
        respondedAt: new Date(),
      });

      await addAuditEntry({
        actorId: input.freelancerId,
        actorType: "freelancer",
        action: `${input.action === "accept" ? "Accepted" : "Declined"} PO ${po.poNumber}`,
        entityType: "purchase_order",
        entityId: input.id,
      });

      return { success: true };
    }),
});
