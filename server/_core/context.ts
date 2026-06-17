import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { AdminAccount, User } from "../../drizzle/schema";
import { getAdminById } from "../db";
import { getAdminSessionFromReq, verifyAdminSession } from "./adminSession";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  admin: AdminAccount | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let admin: AdminAccount | null = null;

  // Try Manus OAuth session (legacy — kept for backward compat during transition)
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    user = null;
  }

  // Try standalone admin session cookie
  try {
    const token = getAdminSessionFromReq(opts.req);
    const session = await verifyAdminSession(token);
    if (session) {
      const account = await getAdminById(session.adminId);
      if (account && account.isActive) {
        admin = account;
      }
    }
  } catch {
    admin = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    admin,
  };
}
