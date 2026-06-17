import { TRPCError } from "@trpc/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  addAuditEntry,
  createFreelancer,
  getFreelancerByEmail,
  getFreelancerById,
  updateFreelancer,
} from "../db";
import { sendEmail, buildNewSignupEmail } from "../email";
import { publicProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";
import { FREELANCER_COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import {
  signFreelancerSession,
  verifyFreelancerSession,
  getFreelancerSessionFromReq,
} from "../_core/freelancerSession";

export { signFreelancerSession, verifyFreelancerSession, getFreelancerSessionFromReq };

const rateSchema = z.record(
  z.string(),
  z.object({ rate: z.number(), currency: z.string(), unit: z.string() })
);

export const freelancerRouter = router({
  // Public: register
  register: publicProcedure
    .input(z.object({
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
        name: z.string(),
      })).optional(),
    }))
    .mutation(async ({ input }) => {
      const existing = await getFreelancerByEmail(input.email);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "A profile with this email already exists." });
      }

      // Upload CV
      let cvFileKey: string | undefined;
      let cvFileUrl: string | undefined;
      let cvFileName: string | undefined;
      if (input.cvFileBase64 && input.cvFileName) {
        const buffer = Buffer.from(input.cvFileBase64, "base64");
        const key = `cvs/${nanoid()}-${input.cvFileName}`;
        const uploadResult = await storagePut(key, buffer, "application/pdf");
        cvFileKey = key;
        cvFileUrl = uploadResult.url;
        cvFileName = input.cvFileName;
      }

      // Upload portfolio files
      const portfolioFiles: Array<{ key: string; url: string; name: string }> = [];
      for (const pf of input.portfolioFilesBase64 ?? []) {
        const buffer = Buffer.from(pf.base64, "base64");
        const key = `portfolios/${nanoid()}-${pf.name}`;
        const uploadResult2 = await storagePut(key, buffer, "application/pdf");
        portfolioFiles.push({ key, url: uploadResult2.url, name: pf.name });
      }

      // Hash password if provided
      let passwordHash: string | undefined;
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
        rates: input.rates as any,
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
        portfolioFiles: portfolioFiles.length > 0 ? portfolioFiles : undefined,
        status: "pending",
      });

      const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
      if (adminEmail) {
        await sendEmail({
          to: adminEmail,
          subject: `New Vendor Registration: ${input.name}`,
          html: buildNewSignupEmail(input.name),
        });
      }

      await addAuditEntry({
        actorId: freelancer!.id,
        actorName: input.name,
        actorType: "freelancer",
        action: "Registered as new vendor",
        entityType: "freelancer",
        entityId: freelancer!.id,
      });

      return { success: true, id: freelancer!.id };
    }),

  // Get profile by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const freelancer = await getFreelancerById(input.id);
      if (!freelancer) throw new TRPCError({ code: "NOT_FOUND" });
      return freelancer;
    }),

  // Get profile by email
  getByEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const freelancer = await getFreelancerByEmail(input.email);
      if (!freelancer) throw new TRPCError({ code: "NOT_FOUND" });
      return freelancer;
    }),

  // Update own profile
  updateMyProfile: publicProcedure
    .input(z.object({
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
        name: z.string(),
      })).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, cvFileBase64, cvFileName, portfolioFilesBase64, ...data } = input;
      const updateData: Record<string, unknown> = { ...data };

      if (cvFileBase64 && cvFileName) {
        const buffer = Buffer.from(cvFileBase64, "base64");
        const key = `cvs/${nanoid()}-${cvFileName}`;
        const cvUpload = await storagePut(key, buffer, "application/pdf");
        updateData.cvFileKey = key;
        updateData.cvFileUrl = cvUpload.url;
        updateData.cvFileName = cvFileName;
      }

      if (portfolioFilesBase64 && portfolioFilesBase64.length > 0) {
        const portfolioFiles: Array<{ key: string; url: string; name: string }> = [];
        for (const pf of portfolioFilesBase64) {
          const buffer = Buffer.from(pf.base64, "base64");
          const key = `portfolios/${nanoid()}-${pf.name}`;
          const pfUpload = await storagePut(key, buffer, "application/pdf");
          portfolioFiles.push({ key, url: pfUpload.url, name: pf.name });
        }
        updateData.portfolioFiles = portfolioFiles;
      }

      await updateFreelancer(id, updateData as any);
      await addAuditEntry({
        actorId: id,
        actorType: "freelancer",
        action: "Updated own profile",
        entityType: "freelancer",
        entityId: id,
      });
      return { success: true };
    }),

  // Login with email + password
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const freelancer = await getFreelancerByEmail(input.email.toLowerCase().trim());
      if (!freelancer || !freelancer.passwordHash) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password." });
      }
      const valid = await bcrypt.compare(input.password, freelancer.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password." });
      }
      if (freelancer.status === "inactive") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Your account has been deactivated. Please contact support." });
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
          status: freelancer.status,
        },
      };
    }),

  // Get current freelancer session
  me: publicProcedure
    .query(async ({ ctx }) => {
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
        tier: freelancer.tier,
      };
    }),

  // Logout freelancer
  logout: publicProcedure
    .mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(FREELANCER_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),
});
