import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  addAuditEntry,
  createInvoice,
  getFreelancerById,
  getInvoiceById,
  listInvoices,
  updateInvoice,
} from "../db";
import { sendEmail, buildInvoiceStatusEmail } from "../email";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";

const NET_45_DAYS = 45;

export const invoiceRouter = router({
  // Freelancer: submit invoice
  submit: publicProcedure
    .input(z.object({
      freelancerId: z.number(),
      poId: z.number().optional(),
      poNumber: z.string().optional(),
      serviceDescription: z.string().min(1),
      languagePair: z.string().optional(),
      quantity: z.string(),
      unit: z.string(),
      rate: z.string(),
      currency: z.enum(["USD", "EUR", "EGP"]),
      totalAmount: z.string(),
      invoiceDate: z.string(),
      invoiceFileBase64: z.string(),
      invoiceFileName: z.string(),
    }))
    .mutation(async ({ input }) => {
      const freelancer = await getFreelancerById(input.freelancerId);
      if (!freelancer) throw new TRPCError({ code: "NOT_FOUND" });

      const buffer = Buffer.from(input.invoiceFileBase64, "base64");
      const key = `invoices/${nanoid()}-${input.invoiceFileName}`;
      const { url } = await storagePut(key, buffer, "application/pdf");

      const submittedAt = new Date();
      const dueDate = new Date(submittedAt.getTime() + NET_45_DAYS * 24 * 60 * 60 * 1000);

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
        status: "submitted",
      });

      await addAuditEntry({
        actorId: input.freelancerId,
        actorType: "freelancer",
        action: `Submitted invoice for ${input.serviceDescription}`,
        entityType: "invoice",
      });

      return { success: true };
    }),

  // Freelancer: get own invoices
  getMyInvoices: publicProcedure
    .input(z.object({
      freelancerId: z.number(),
      status: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return listInvoices({ freelancerId: input.freelancerId, status: input.status });
    }),

  // Admin: list all invoices
  list: adminProcedure
    .input(z.object({
      freelancerId: z.number().optional(),
      status: z.string().optional(),
      currency: z.string().optional(),
      dueSoon: z.boolean().optional(),
      overdue: z.boolean().optional(),
    }).optional())
    .query(async ({ input }) => {
      return listInvoices(input);
    }),

  // Admin: get single invoice
  getById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const inv = await getInvoiceById(input.id);
      if (!inv) throw new TRPCError({ code: "NOT_FOUND" });
      return inv;
    }),

  // Admin: update invoice status
  updateStatus: adminProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["under_review", "approved", "rejected", "paid"]),
      adminNote: z.string().optional(),
      paidAt: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const inv = await getInvoiceById(input.id);
      if (!inv) throw new TRPCError({ code: "NOT_FOUND" });

      const updateData: Record<string, unknown> = {
        status: input.status,
        adminNote: input.adminNote,
      };
      if (input.status === "paid" && input.paidAt) {
        updateData.paidAt = new Date(input.paidAt);
      }

      await updateInvoice(input.id, updateData as any);

      const freelancer = await getFreelancerById(inv.freelancerId);
      if (freelancer) {
        await sendEmail({
          to: freelancer.email,
          subject: `Invoice Status Update`,
          html: buildInvoiceStatusEmail(freelancer.name, inv.id, input.status, input.adminNote),
        });
      }

      await addAuditEntry({
        actorId: ctx.admin.id,
        actorName: ctx.admin.name || "Admin",
        actorType: "admin",
        action: `Updated invoice #${inv.id} status to ${input.status}`,
        entityType: "invoice",
        entityId: input.id,
      });

      return { success: true };
    }),
});
