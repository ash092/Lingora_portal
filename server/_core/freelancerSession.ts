/**
 * Freelancer JWT session helpers — kept in _core to avoid circular imports
 * between server/_core/trpc.ts and server/routers/freelancer.ts.
 */
import { SignJWT, jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";
import { FREELANCER_COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ENV } from "./env";

const FREELANCER_JWT_SECRET = () =>
  new TextEncoder().encode(ENV.cookieSecret + "_freelancer");

export async function signFreelancerSession(
  freelancerId: number,
  email: string
): Promise<string> {
  const issuedAt = Date.now();
  const expiresInMs = ONE_YEAR_MS;
  const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
  return new SignJWT({ freelancerId, email })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(FREELANCER_JWT_SECRET());
}

export async function verifyFreelancerSession(
  token: string | undefined | null
): Promise<{ freelancerId: number; email: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, FREELANCER_JWT_SECRET(), {
      algorithms: ["HS256"],
    });
    const { freelancerId, email } = payload as Record<string, unknown>;
    if (typeof freelancerId !== "number" || typeof email !== "string")
      return null;
    return { freelancerId, email };
  } catch {
    return null;
  }
}

export function getFreelancerSessionFromReq(req: {
  headers: { cookie?: string };
}): string | undefined {
  const cookies = parseCookieHeader(req.headers.cookie ?? "");
  return cookies[FREELANCER_COOKIE_NAME];
}
