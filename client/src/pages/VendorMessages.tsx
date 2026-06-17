import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function VendorMessages() {
  const [body, setBody] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: thread, isLoading, refetch } =
    trpc.messages.vendorGetThread.useQuery(undefined, { refetchInterval: 10000 });

  const sendMutation = trpc.messages.vendorSend.useMutation({
    onSuccess: () => {
      setBody("");
      refetch();
    },
    onError: (err) => {
      toast.error("Failed to send", { description: err.message });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread]);

  const handleSend = () => {
    if (!body.trim()) return;
    sendMutation.mutate({ body: body.trim() });
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center gap-3 bg-background shrink-0">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
          <MessageSquare className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-sm">Lingora Team</p>
          <p className="text-xs text-muted-foreground">Messages from your project manager</p>
        </div>
      </div>

      {/* Thread */}
      <ScrollArea className="flex-1 px-6 py-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : !thread || thread.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <MessageSquare className="w-10 h-10 opacity-20" />
            <p className="text-sm text-center">
              No messages yet. Send a message to the Lingora team below.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {thread.map((msg) => {
              const isAdmin = msg.senderRole === "admin";
              return (
                <div
                  key={msg.id}
                  className={cn("flex gap-3", isAdmin ? "flex-row" : "flex-row-reverse")}
                >
                  <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {isAdmin ? "L" : "Me"}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                      isAdmin
                        ? "bg-muted text-foreground rounded-tl-sm"
                        : "bg-primary text-primary-foreground rounded-tr-sm"
                    )}
                  >
                    {isAdmin && (
                      <p className="text-xs font-medium mb-1 text-primary">
                        {msg.senderName ?? "Lingora Team"}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                    <p
                      className={cn(
                        "text-xs mt-1",
                        isAdmin ? "text-muted-foreground" : "text-primary-foreground/70 text-right"
                      )}
                    >
                      {new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Composer */}
      <div className="px-6 py-4 border-t bg-background shrink-0">
        <div className="flex gap-3 items-end">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a message to the Lingora team..."
            className="resize-none min-h-[80px] flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!body.trim() || sendMutation.isPending}
            className="shrink-0"
          >
            {sendMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Press Ctrl+Enter to send</p>
      </div>
    </div>
  );
}
