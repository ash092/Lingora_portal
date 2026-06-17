import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { getFreelancerById } from "../db";
import { getFreelancerSessionFromReq, verifyFreelancerSession } from "./freelancerSession";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

// Admin procedure — uses standalone admin_session cookie (no Manus OAuth)
export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.admin) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        admin: ctx.admin,
      },
    });
  }),
);

// Freelancer procedure — uses freelancer_session cookie
export const freelancerProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    const token = getFreelancerSessionFromReq(ctx.req);
    const session = await verifyFreelancerSession(token);
    if (!session) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    const freelancer = await getFreelancerById(session.freelancerId);
    if (!freelancer || freelancer.status === "inactive") {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        freelancer,
      },
    });
  }),
);
