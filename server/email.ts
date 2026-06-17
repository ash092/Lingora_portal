/**
 * Email service using Resend.
 * Requires RESEND_API_KEY environment variable.
 */

const RESEND_API_URL = "https://api.resend.com/emails";
import { ENV } from "./_core/env";

const FROM_EMAIL = ENV.resendFromEmail || "Lingora Portal <portal@lingora.tech>";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<boolean> {
  const apiKey = ENV.resendApiKey;
  if (!apiKey) {
    console.warn("[Email] RESEND_API_KEY not set — email not sent");
    return false;
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: Array.isArray(opts.to) ? opts.to : [opts.to],
        subject: opts.subject,
        html: opts.html,
        reply_to: opts.replyTo,
      }),
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

// ─── Email templates ──────────────────────────────────────────────────────────

export function buildNewSignupEmail(freelancerName: string): string {
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

export function buildApprovalEmail(freelancerName: string, status: "active" | "inactive"): string {
  const approved = status === "active";
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #c0392b; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Lingora Vendor Portal</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #1a1a2e;">Profile ${approved ? "Approved" : "Status Update"}</h2>
        <p>Dear ${freelancerName},</p>
        ${approved
          ? `<p>Your profile has been <strong>approved</strong>. You can now log in to the vendor portal to view and accept purchase orders.</p>`
          : `<p>Your profile status has been updated to <strong>Inactive</strong>. Please contact us if you have any questions.</p>`
        }
        <a href="${ENV.appUrl || "https://vendors.lingoraloc.com"}/login" 
           style="display: inline-block; background: #c0392b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 16px;">
          Log In to Portal
        </a>
      </div>
    </div>
  `;
}

export function buildPONotificationEmail(freelancerName: string, po: {
  poNumber: string;
  projectName: string;
  serviceType: string;
  totalValue: string;
  currency: string;
  dueDate?: Date | null;
}): string {
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

export function buildInvoiceStatusEmail(freelancerName: string, invoiceId: number, status: string, adminNote?: string | null): string {
  const statusLabels: Record<string, string> = {
    under_review: "Under Review",
    approved: "Approved",
    rejected: "Rejected",
    paid: "Paid",
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
