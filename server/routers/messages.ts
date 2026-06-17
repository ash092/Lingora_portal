import { z } from "zod";
import { adminProcedure, freelancerProcedure, router } from "../_core/trpc";
import {
  createMessage,
  getAllConversationSummaries,
  getFreelancerById,
  getMessagesByFreelancer,
  markMessagesReadByAdmin,
  markMessagesReadByVendor,
} from "../db";

const ADMIN_NOTIFY_EMAIL = "vm@lingoraloc.com";

export const messagesRouter = router({
  // ── Admin: list all conversation threads ──────────────────────────────────
  listConversations: adminProcedure.query(async () => {
    const summaries = await getAllConversationSummaries();
    // Enrich with freelancer name/email
    const enriched = await Promise.all(
      summaries.map(async (s) => {
        const f = await getFreelancerById(s.freelancerId);
        return {
          ...s,
          freelancerName: f?.name ?? "Unknown",
          freelancerEmail: f?.email ?? "",
        };
      })
    );
    return enriched;
  }),

  // ── Admin: get full thread for a vendor ───────────────────────────────────
  getThread: adminProcedure
    .input(z.object({ freelancerId: z.number() }))
    .query(async ({ input }) => {
      await markMessagesReadByAdmin(input.freelancerId);
      return getMessagesByFreelancer(input.freelancerId);
    }),

  // ── Admin: send a message to a vendor ────────────────────────────────────
  adminSend: adminProcedure
    .input(
      z.object({
        freelancerId: z.number(),
        body: z.string().min(1).max(5000),
        poId: z.number().optional(),
        invoiceId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
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
        isReadByVendor: false,
      });

      // Email notification to vendor (fire-and-forget)
      try {
        const { sendEmail } = await import("../email");
        await sendEmail({
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
          replyTo: ADMIN_NOTIFY_EMAIL,
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
  vendorSend: freelancerProcedure
    .input(
      z.object({
        body: z.string().min(1).max(5000),
        poId: z.number().optional(),
        invoiceId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await createMessage({
        freelancerId: ctx.freelancer.id,
        senderRole: "vendor",
        senderName: ctx.freelancer.name,
        body: input.body,
        poId: input.poId,
        invoiceId: input.invoiceId,
        isReadByAdmin: false,
        isReadByVendor: true,
      });

      // Email notification to admin (fire-and-forget)
      try {
        const { sendEmail } = await import("../email");
        await sendEmail({
          to: ADMIN_NOTIFY_EMAIL,
          subject: `New message from vendor: ${ctx.freelancer.name}`,
          html: `
            <p>You have a new message from <strong>${ctx.freelancer.name}</strong> (${ctx.freelancer.email}):</p>
            <blockquote style="border-left:3px solid #ccc;padding-left:12px;color:#555;">
              ${input.body.replace(/\n/g, "<br>")}
            </blockquote>
            <p>Log in to the admin panel to reply.</p>
          `,
          replyTo: ctx.freelancer.email,
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
  }),
});
