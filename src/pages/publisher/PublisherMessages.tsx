import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface Conversation {
  order_id: string;
  other_name: string;
  other_id: string;
  last_message: string;
  last_time: string;
  website_domain: string;
}

export default function PublisherMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetchConversations = async () => {
      const { data: orders } = await supabase
        .from("orders")
        .select("id, buyer:profiles!orders_buyer_id_fkey(id, full_name), websites(domain)")
        .eq("publisher_id", user.id)
        .order("updated_at", { ascending: false });

      if (!orders) { setLoading(false); return; }

      const convos: Conversation[] = [];
      for (const order of orders as any[]) {
        const { data: msgs } = await supabase
          .from("messages")
          .select("content, created_at")
          .eq("order_id", order.id)
          .order("created_at", { ascending: false })
          .limit(1);

        convos.push({
          order_id: order.id,
          other_name: order.buyer?.full_name || "Buyer",
          other_id: order.buyer?.id,
          last_message: msgs?.[0]?.content || "No messages yet",
          last_time: msgs?.[0]?.created_at || order.updated_at,
          website_domain: order.websites?.domain || "",
        });
      }
      setConversations(convos);
      if (convos.length > 0) setSelectedOrder(convos[0].order_id);
      setLoading(false);
    };
    fetchConversations();
  }, [user]);

  useEffect(() => {
    if (!selectedOrder) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*, sender:profiles!messages_sender_id_fkey(full_name)")
        .eq("order_id", selectedOrder)
        .order("created_at", { ascending: true });
      setMessages(data || []);
    };
    fetchMessages();

    const channel = supabase
      .channel(`msgs-${selectedOrder}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `order_id=eq.${selectedOrder}` }, () => fetchMessages())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedOrder]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedOrder || !user) return;
    await supabase.from("messages").insert({
      order_id: selectedOrder,
      sender_id: user.id,
      content: newMessage.trim(),
    });
    setNewMessage("");
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const selectedConvo = conversations.find((c) => c.order_id === selectedOrder);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <p className="text-sm text-muted-foreground mt-1">Communicate with buyers</p>
      </div>

      {conversations.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">No conversations yet. Messages will appear when you have orders.</div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card lg:col-span-1">
            <div className="divide-y divide-border">
              {conversations.map((c) => (
                <button
                  key={c.order_id}
                  onClick={() => setSelectedOrder(c.order_id)}
                  className={`w-full text-left p-4 hover:bg-muted/50 transition ${c.order_id === selectedOrder ? "bg-primary/5" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {c.other_name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-foreground block">{c.other_name}</span>
                      <p className="text-xs text-muted-foreground truncate">{c.last_message}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card lg:col-span-2 flex flex-col min-h-[400px]">
            <div className="border-b border-border p-4">
              <span className="font-semibold text-foreground text-sm">{selectedConvo?.other_name}</span>
              <span className="text-xs text-muted-foreground ml-2">{selectedConvo?.website_domain}</span>
            </div>
            <div className="flex-1 p-4 space-y-3 overflow-auto">
              {messages.map((m: any) => (
                <div key={m.id} className={`flex gap-3 ${m.sender_id === user?.id ? "justify-end" : ""}`}>
                  <div className={`rounded-lg p-3 max-w-md ${m.sender_id === user?.id ? "bg-primary/10" : "bg-secondary"}`}>
                    <p className="text-sm text-foreground">{m.content}</p>
                    <span className="text-[10px] text-muted-foreground mt-1 block">{new Date(m.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="border-t border-border p-4 flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                className="bg-secondary border-border"
              />
              <Button onClick={sendMessage}>Send</Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
