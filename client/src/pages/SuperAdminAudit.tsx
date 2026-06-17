import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollText, Search } from "lucide-react";

function actorBadge(actorType: string) {
  return actorType === "admin"
    ? "bg-blue-100 text-blue-700"
    : "bg-purple-100 text-purple-700";
}

function entityBadge(entityType: string | null) {
  const map: Record<string, string> = {
    freelancer: "bg-green-100 text-green-700",
    purchase_order: "bg-orange-100 text-orange-700",
    invoice: "bg-yellow-100 text-yellow-700",
    email: "bg-pink-100 text-pink-700",
  };
  return entityType ? (map[entityType] ?? "bg-gray-100 text-gray-600") : "";
}

export default function SuperAdminAudit() {
  const [search, setSearch] = useState("");
  const [limitStr, setLimitStr] = useState("200");

  const limit = Math.min(500, Math.max(10, parseInt(limitStr) || 200));
  const auditLog = trpc.superAdmin.auditLog.useQuery({ limit });

  const filtered = auditLog.data?.filter(entry => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      entry.actorName?.toLowerCase().includes(q) ||
      entry.action?.toLowerCase().includes(q) ||
      entry.entityType?.toLowerCase().includes(q)
    );
  }) ?? [];

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Full activity trail — admin actions and freelancer self-edits
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by actor, action, or entity..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={limitStr} onValueChange={setLimitStr}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">Last 50</SelectItem>
              <SelectItem value="100">Last 100</SelectItem>
              <SelectItem value="200">Last 200</SelectItem>
              <SelectItem value="500">Last 500</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {auditLog.data?.length ?? 0} entries
        </p>

        {/* Log table */}
        <Card className="border border-border overflow-hidden">
          {auditLog.isLoading ? (
            <CardContent className="py-12 text-center text-muted-foreground">Loading audit log...</CardContent>
          ) : !filtered.length ? (
            <CardContent className="py-12 text-center">
              <ScrollText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No audit entries found.</p>
            </CardContent>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Timestamp</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actor</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Action</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Entity</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Entity ID</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry) => (
                    <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {entry.actorName ?? `#${entry.actorId}`}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${actorBadge(entry.actorType)}`}>
                          {entry.actorType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground max-w-[280px]">
                        <span className="line-clamp-2">{entry.action}</span>
                      </td>
                      <td className="px-4 py-3">
                        {entry.entityType ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${entityBadge(entry.entityType)}`}>
                            {entry.entityType.replace("_", " ")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {entry.entityId ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
