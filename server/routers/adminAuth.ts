/**
 * Standalone admin authentication router.
 * No Manus OAuth dependency — uses email/password + admin_session JWT cookie.
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { createAdminAccount, getAdminByEmail, getAdminById, listAdmins, updateAdminAccount } from "../db";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { ADMIN_COOKIE_NAME, signAdminSession } from "../_core/adminSession";

const ADMIN_SESSION_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

function setAdminCookie(res: any, token: string) {
  res.cookie(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ADMIN_SESSION_MAX_AGE * 1000,
    path: "/",
  });
}

export const adminAuthRouter = router({
  // ── Login ──────────────────────────────────────────────────────────────────
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const admin = await getAdminByEmail(input.email);
      if (!admin || !admin.isActive) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      const valid = await bcrypt.compare(input.password, admin.passwordHash);
      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      // Update last signed in
      await updateAdminAccount(admin.id, { lastSignedIn: new Date() });

      // Issue JWT cookie
      const token = await signAdminSession(admin.id, admin.email, admin.role);
      setAdminCookie(ctx.res, token);

      return {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      };
    }),

  // ── Current admin ──────────────────────────────────────────────────────────
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.admin) return null;
    return {
      id: ctx.admin.id,
      name: ctx.admin.name,
      email: ctx.admin.email,
      role: ctx.admin.role,
    };
  }),

  // ── Logout ─────────────────────────────────────────────────────────────────
  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie(ADMIN_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    return { success: true };
  }),

  // ── First-run setup: create initial super admin ────────────────────────────
  // Only works when there are zero admin accounts in the database.
  setup: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(8),
      setupKey: z.string(), // Must match ADMIN_SETUP_KEY env var
    }))
    .mutation(async ({ input, ctx }) => {
      // Validate setup key
      const setupKey = process.env.ADMIN_SETUP_KEY;
      if (!setupKey || input.setupKey !== setupKey) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Invalid setup key",
        });
      }

      // Only allow if no admins exist yet
      const existing = await listAdmins();
      if (existing.length > 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin accounts already exist. Use the admin panel to create more.",
        });
      }

      const passwordHash = await bcrypt.hash(input.password, 12);
      await createAdminAccount({
        name: input.name,
        email: input.email,
        passwordHash,
        role: "super_admin",
      });

      // Auto-login after setup
      const admin = await getAdminByEmail(input.email);
      if (admin) {
        const token = await signAdminSession(admin.id, admin.email, admin.role);
        setAdminCookie(ctx.res, token);
      }

      return { success: true };
    }),

  // ── Change own password ────────────────────────────────────────────────────
  changePassword: adminProcedure
    .input(z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8),
    }))
    .mutation(async ({ input, ctx }) => {
      const admin = await getAdminById(ctx.admin.id);
      if (!admin) throw new TRPCError({ code: "NOT_FOUND" });

      const valid = await bcrypt.compare(input.currentPassword, admin.passwordHash);
      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Current password is incorrect",
        });
      }

      const newHash = await bcrypt.hash(input.newPassword, 12);
      await updateAdminAccount(ctx.admin.id, { passwordHash: newHash });
      return { success: true };
    }),
});
