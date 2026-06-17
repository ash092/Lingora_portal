import { COOKIE_NAME, FREELANCER_COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { signFreelancerSession } from "../routers/freelancer";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    // Intent is passed as a query param on the redirectUri itself.
    // For vendor OAuth: redirectUri = .../api/oauth/callback?intent=vendor
    // For admin OAuth:  redirectUri = .../api/oauth/callback  (no intent)
    const intent = getQueryParam(req, "intent");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      // sdk.exchangeCodeForToken decodes state as btoa(redirectUri) — this
      // works for both flows because getVendorLoginUrl now uses the same
      // btoa(redirectUri) format, with intent embedded in the redirectUri.
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      const cookieOptions = getSessionCookieOptions(req);

      // ── Vendor intent: issue a freelancer_session cookie ──────────────────
      if (intent === "vendor") {
        const email = userInfo.email?.toLowerCase().trim();
        const name = userInfo.name || "";

        if (!email) {
          // No email from OAuth provider — fall back to registration with name pre-filled
          const params = new URLSearchParams({ name, google: "1" });
          res.redirect(302, `/register?${params.toString()}`);
          return;
        }

        // Look up existing freelancer by email
        const existing = await db.getFreelancerByEmail(email);

        if (existing) {
          // Known vendor — issue session and send to dashboard
          if (existing.status === "inactive") {
            res.redirect(302, `/login?error=deactivated`);
            return;
          }
          const token = await signFreelancerSession(existing.id, existing.email);
          res.cookie(FREELANCER_COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
          res.redirect(302, "/dashboard");
        } else {
          // New vendor — redirect to registration with email/name pre-filled
          const params = new URLSearchParams({ email, name, google: "1" });
          res.redirect(302, `/register?${params.toString()}`);
        }
        return;
      }

      // ── Admin / default intent: issue the standard app_session_id cookie ──
      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      // Redirect admins directly to the admin panel
      res.redirect(302, "/admin");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
