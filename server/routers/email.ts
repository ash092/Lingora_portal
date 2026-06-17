import { z } from "zod";
import {
  addAuditEntry,
  createEmailTemplate,
  deleteEmailTemplate,
  getEmailLogsByFreelancer,
  listEmailTemplates,
  listFreelancers,
  logEmail,
  updateEmailTemplate,
} from "../db";
import { sendEmail } from "../email";
import { adminProcedure, router } from "../_core/trpc";
import { nanoid } from "nanoid";

export const emailRouter = router({
  listTemplates: adminProcedure.query(async () => {
    return listEmailTemplates();
  }),

  createTemplate: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      subject: z.string().min(1),
      body: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      await createEmailTemplate({ ...input, createdBy: ctx.admin.id });
      return { success: true };
    }),

  updateTemplate: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      subject: z.string().optional(),
      body: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateEmailTemplate(id, data);
      return { success: true };
    }),

  deleteTemplate: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteEmailTemplate(input.id);
      return { success: true };
    }),

  // Returns the list of vendors that match the current filters (for live preview)
  previewRecipients: adminProcedure
    .input(z.object({
      filterStatus: z.string().optional(),
      filterTier: z.string().optional(),
      filterCountry: z.string().optional(),
      filterSourceLanguage: z.string().optional(),
      filterTargetLanguage: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const vendors = await listFreelancers({
        status: input.filterStatus || "active",
        tier: input.filterTier,
        country: input.filterCountry,
        filterSourceLanguage: input.filterSourceLanguage,
        filterTargetLanguage: input.filterTargetLanguage,
      });
      return vendors.map((v: { id: number; name: string; email: string; tier?: string | null; sourceLanguages?: string[] | null; targetLanguages?: string[] | null }) => ({
        id: v.id,
        name: v.name,
        email: v.email,
        tier: v.tier,
        sourceLanguages: v.sourceLanguages,
        targetLanguages: v.targetLanguages,
      }));
    }),

  send: adminProcedure
    .input(z.object({
      subject: z.string().min(1),
      body: z.string().min(1),
      recipientIds: z.array(z.number()).optional(),
      filterStatus: z.string().optional(),
      filterTier: z.string().optional(),
      filterCountry: z.string().optional(),
      filterSourceLanguage: z.string().optional(),
      filterTargetLanguage: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const batchId = nanoid();
      const allVendors: Awaited<ReturnType<typeof listFreelancers>> = await listFreelancers({
        status: input.filterStatus || "active",
        tier: input.filterTier,
        country: input.filterCountry,
        filterSourceLanguage: input.filterSourceLanguage,
        filterTargetLanguage: input.filterTargetLanguage,
      });

      const recipients = input.recipientIds && input.recipientIds.length > 0
        ? allVendors.filter((f: { id: number }) => input.recipientIds!.includes(f.id))
        : allVendors;

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
          batchId,
        });

        if (ok) sentCount++; else failedCount++;
      }

      await addAuditEntry({
        actorId: ctx.admin.id,
        actorName: ctx.admin.name || "Admin",
        actorType: "admin",
        action: `Sent batch email to ${sentCount} recipients (${failedCount} failed)`,
      });

      return { success: true, sentCount, failedCount, total: recipients.length };
    }),

  getLog: adminProcedure
    .input(z.object({ freelancerId: z.number() }))
    .query(async ({ input }) => {
      return getEmailLogsByFreelancer(input.freelancerId);
    }),
});
