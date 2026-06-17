import { z } from "zod";
import { listAuditLog } from "../db";
import { adminProcedure, router } from "../_core/trpc";

export const superAdminRouter = router({
  auditLog: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(500).default(200) }).optional())
    .query(async ({ input }) => {
      return listAuditLog(input?.limit ?? 200);
    }),
});
