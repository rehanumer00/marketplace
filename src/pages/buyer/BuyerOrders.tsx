import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { PaymentService } from "@/lib/payment";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";

export default function BuyerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [disputeOrder, setDisputeOrder] = useState<any>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("orders")
      .select("*, websites(domain), publisher:profiles!orders_publisher_id_fkey(full_name)")
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("buyer-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `buyer_id=eq.${user.id}` }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const completeOrder = async (orderId: string) => {
    setProcessing(orderId);
    try {
      await PaymentService.completeOrder(orderId);
      toast({ title: "Order completed", description: "Funds released to publisher wallet." });
      fetchOrders();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setProcessing(null);
  };

  const cancelOrder = async (orderId: string) => {
    setProcessing(orderId);
    try {
      await PaymentService.cancelOrder(orderId);
      toast({ title: "Order cancelled", description: "Payment refunded." });
      fetchOrders();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setProcessing(null);
  };

  const submitDispute = async () => {
    if (!disputeOrder || !disputeReason.trim()) return;
    setProcessing(disputeOrder.id);
    try {
      await PaymentService.disputeOrder(disputeOrder.id, disputeReason.trim());
      toast({ title: "Dispute filed", description: "Escrow funds frozen until resolved by admin." });
      setDisputeOrder(null);
      setDisputeReason("");
      fetchOrders();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setProcessing(null);
  };

  const filtered = filter === "all" ? orders : orders.filter((o: any) => o.status === filter);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">{orders.length} total orders</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40 bg-card border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="disputed">Disputed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">No orders found.</div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Website</TableHead>
                <TableHead className="text-muted-foreground">Title</TableHead>
                <TableHead className="text-muted-foreground">Amount</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Date</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o: any) => (
                <TableRow key={o.id} className="border-border">
                  <TableCell className="text-sm text-muted-foreground">{o.websites?.domain}</TableCell>
                  <TableCell className="text-sm text-foreground">{o.title}</TableCell>
                  <TableCell className="text-sm font-medium text-primary">${o.price}</TableCell>
                  <TableCell><StatusBadge status={o.status} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {o.status === "delivered" && (
                        <Button size="sm" onClick={() => completeOrder(o.id)} disabled={processing === o.id}>
                          {processing === o.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                          Approve & Release
                        </Button>
                      )}
                      {o.status === "pending" && (
                        <Button size="sm" variant="outline" className="border-border" onClick={() => cancelOrder(o.id)} disabled={processing === o.id}>
                          Cancel
                        </Button>
                      )}
                      {["delivered", "in_progress"].includes(o.status) && (
                        <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => setDisputeOrder(o)}>
                          <AlertTriangle className="h-3 w-3 mr-1" />Dispute
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

      {/* Dispute Dialog */}
      <Dialog open={!!disputeOrder} onOpenChange={() => setDisputeOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>File Dispute – {disputeOrder?.title}</DialogTitle>
            <DialogDescription>Filing a dispute will freeze escrow funds until an admin resolves the issue.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason for dispute *</Label>
              <Textarea value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} placeholder="Describe the issue..." className="mt-1 bg-secondary border-border" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisputeOrder(null)}>Cancel</Button>
            <Button variant="destructive" onClick={submitDispute} disabled={!disputeReason.trim() || !!processing}>
              {processing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              File Dispute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
