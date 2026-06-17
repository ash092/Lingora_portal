import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, MessageSquare, Send, User } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AdminMessages() {
  const [selectedFreelancerId, setSelectedFreelancerId] = useState<number | null>(null);
  const [replyBody, setReplyBody] = useState("");

  const { data: conversations, isLoading: loadingConvs, refetch: refetchConvs } =
    trpc.messages.listConversations.useQuery(undefined, { refetchInterval: 15000 });

  const { data: thread, isLoading: loadingThread, refetch: refetchThread } =
    trpc.messages.getThread.useQuery(
      { freelancerId: selectedFreelancerId! },
      { enabled: selectedFreelancerId !== null, refetchInterval: 10000 }
    );

  const sendMutation = trpc.messages.adminSend.useMutation({
    onSuccess: () => {
      setReplyBody("");
      refetchThread();
      refetchConvs();
    },
    onError: (err) => {
      toast.error("Failed to send", { description: err.message });
    },
  });

  const selectedConv = conversations?.find((c) => c.freelancerId === selectedFreelancerId);

  const handleSend = () => {
    if (!selectedFreelancerId || !replyBody.trim()) return;
    sendMutation.mutate({ freelancerId: selectedFreelancerId, body: replyBody.trim() });
  };

  const totalUnread = conversations?.reduce((acc, c) => acc + c.unreadForAdmin, 0) ?? 0;

  return (
    <AdminLayout>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* Conversation list */}
        <div className="w-80 border-r flex flex-col bg-background shrink-0">
          <div className="px-4 py-3 border-b flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Conversations</span>
            {totalUnread > 0 && (
              <Badge variant="destructive" className="ml-auto text-xs px-1.5 py-0">
                {totalUnread}
              </Badge>
            )}
          </div>
          <ScrollArea className="flex-1">
            {loadingConvs ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : conversations?.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-12 px-4">
                No conversations yet. Start one from a vendor's profile.
              </div>
            ) : (
              conversations?.map((conv) => (
                <button
                  key={conv.freelancerId}
                  onClick={() => setSelectedFreelancerId(conv.freelancerId)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b hover:bg-muted/50 transition-colors",
                    selectedFreelancerId === conv.freelancerId && "bg-muted"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className="text-xs">
                        {conv.freelancerName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm truncate flex-1">
                      {conv.freelancerName}
                    </span>
                    {conv.unreadForAdmin > 0 && (
                      <Badge variant="destructive" className="text-xs px-1.5 py-0 shrink-0">
                        {conv.unreadForAdmin}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate pl-9">
                    {conv.latestMessage}
                  </p>
                  <p className="text-xs text-muted-foreground/60 pl-9 mt-0.5">
                    {new Date(conv.latestAt).toLocaleDateString()}
                  </p>
                </button>
              ))
            )}
          </ScrollArea>
        </div>

        {/* Thread view */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedFreelancerId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <MessageSquare className="w-12 h-12 opacity-20" />
              <p className="text-sm">Select a conversation to view messages</p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="px-6 py-3 border-b flex items-center gap-3 bg-background shrink-0">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-sm">
                    {(selectedConv?.freelancerName ?? "?").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{selectedConv?.freelancerName}</p>
                  <p className="text-xs text-muted-foreground">{selectedConv?.freelancerEmail}</p>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 px-6 py-4">
                {loadingThread ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : thread?.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-12">
                    No messages yet. Send the first message below.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {thread?.map((msg) => {
                      const isAdmin = msg.senderRole === "admin";
                      return (
                        <div
                          key={msg.id}
                          className={cn("flex gap-3", isAdmin ? "flex-row-reverse" : "flex-row")}
                        >
                          <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                            <AvatarFallback className="text-xs">
                              {isAdmin ? "A" : (msg.senderName ?? "V").slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={cn(
                              "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm",
                              isAdmin
                                ? "bg-primary text-primary-foreground rounded-tr-sm"
                                : "bg-muted text-foreground rounded-tl-sm"
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                            <p
                              className={cn(
                                "text-xs mt-1",
                                isAdmin ? "text-primary-foreground/70 text-right" : "text-muted-foreground"
                              )}
                            >
                              {new Date(msg.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              {/* Composer */}
              <div className="px-6 py-4 border-t bg-background shrink-0">
                <div className="flex gap-3 items-end">
                  <Textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder="Type your reply..."
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
                    disabled={!replyBody.trim() || sendMutation.isPending}
                    className="shrink-0"
                  >
                    {sendMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Press Ctrl+Enter to send
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
