import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { adminRouter } from "./routers/admin";
import { adminAuthRouter } from "./routers/adminAuth";
import { emailRouter } from "./routers/email";
import { freelancerRouter } from "./routers/freelancer";
import { invoiceRouter } from "./routers/invoice";
import { poRouter } from "./routers/po";
import { messagesRouter } from "./routers/messages";
import { superAdminRouter } from "./routers/superAdmin";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  adminAuth: adminAuthRouter,
  admin: adminRouter,
  freelancer: freelancerRouter,
  po: poRouter,
  invoice: invoiceRouter,
  email: emailRouter,
  superAdmin: superAdminRouter,
  messages: messagesRouter,
});

export type AppRouter = typeof appRouter;
