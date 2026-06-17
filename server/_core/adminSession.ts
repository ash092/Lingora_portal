/**
 * Admin JWT session helpers — standalone email/password admin auth.
 * No Manus OAuth dependency.
 */
import { SignJWT, jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";
import { ONE_YEAR_MS } from "@shared/const";
import { ENV } from "./env";

export const ADMIN_COOKIE_NAME = "admin_session";

const ADMIN_JWT_SECRET = () =>
  new TextEncoder().encode(ENV.cookieSecret + "_admin");

export async function signAdminSession(
  adminId: number,
  email: string,
  role: string
): Promise<string> {
  const issuedAt = Date.now();
  const expiresInMs = ONE_YEAR_MS;
  const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
  return new SignJWT({ adminId, email, role })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(ADMIN_JWT_SECRET());
}

export async function verifyAdminSession(
  token: string | undefined | null
): Promise<{ adminId: number; email: string; role: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, ADMIN_JWT_SECRET(), {
      algorithms: ["HS256"],
    });
    const { adminId, email, role } = payload as Record<string, unknown>;
    if (
      typeof adminId !== "number" ||
      typeof email !== "string" ||
      typeof role !== "string"
    )
      return null;
    return { adminId, email, role };
  } catch {
    return null;
  }
}

export function getAdminSessionFromReq(req: {
  headers: { cookie?: string };
}): string | undefined {
  const cookies = parseCookieHeader(req.headers.cookie ?? "");
  return cookies[ADMIN_COOKIE_NAME];
}
