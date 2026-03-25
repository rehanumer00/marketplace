import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { PaymentService } from "@/lib/payment";
import { Loader2 } from "lucide-react";

export default function PublisherOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("orders")
      .select("*, websites(domain), buyer:profiles!orders_buyer_id_fkey(full_name)")
      .eq("publisher_id", user.id)
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("publisher-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `publisher_id=eq.${user.id}` }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const acceptOrder = async (orderId: string) => {
    setProcessing(orderId);
    const { error } = await supabase.from("orders").update({ status: "in_progress" }).eq("id", orderId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Order accepted" }); fetchOrders(); }
    setProcessing(null);
  };

  const declineOrder = async (orderId: string) => {
    setProcessing(orderId);
    try {
      await PaymentService.cancelOrder(orderId);
      toast({ title: "Order declined", description: "Buyer has been refunded." });
      fetchOrders();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setProcessing(null);
  };

  const deliverOrder = async (orderId: string) => {
    setProcessing(orderId);
    const { error } = await supabase.from("orders").update({ status: "delivered", delivered_at: new Date().toISOString() }).eq("id", orderId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Order marked as delivered" }); fetchOrders(); }
    setProcessing(null);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Incoming Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">{orders.length} order{orders.length !== 1 ? "s" : ""}</p>
      </div>

      {orders.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">No orders yet.</div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Buyer</TableHead>
                <TableHead className="text-muted-foreground">Website</TableHead>
                <TableHead className="text-muted-foreground">Title</TableHead>
                <TableHead className="text-muted-foreground">Amount</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id} className="border-border">
                  <TableCell className="text-sm text-muted-foreground">{o.buyer?.full_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{o.websites?.domain}</TableCell>
                  <TableCell className="text-sm text-foreground">{o.title}</TableCell>
                  <TableCell className="text-sm font-medium text-primary">${o.price}</TableCell>
                  <TableCell><StatusBadge status={o.status} /></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {o.status === "pending" && (
                        <>
                          <Button size="sm" onClick={() => acceptOrder(o.id)} disabled={processing === o.id}>
                            {processing === o.id && <Loader2 className="h-3 w-3 animate-spin mr-1" />}Accept
                          </Button>
                          <Button size="sm" variant="outline" className="border-border" onClick={() => declineOrder(o.id)} disabled={processing === o.id}>
                            Decline
                          </Button>
                        </>
                      )}
                      {o.status === "in_progress" && (
                        <Button size="sm" onClick={() => deliverOrder(o.id)} disabled={processing === o.id}>
                          {processing === o.id && <Loader2 className="h-3 w-3 animate-spin mr-1" />}Mark Delivered
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </motion.div>
  );
}
