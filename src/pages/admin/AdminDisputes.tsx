import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, RefreshCw, ArrowUpRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { PaymentService } from "@/lib/payment";

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<any>(null);
  const [resolution, setResolution] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchDisputes = async () => {
    const { data } = await supabase.from("disputes").select("*, orders(id, title, price, buyer:profiles!orders_buyer_id_fkey(full_name), publisher:profiles!orders_publisher_id_fkey(full_name), websites(domain))").order("created_at", { ascending: false });
    setDisputes(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchDisputes(); }, []);

  const resolve = async (resolutionType: "refund_buyer" | "release_publisher") => {
    if (!resolving) return;
    setProcessing(true);
    try {
      await PaymentService.resolveDispute(resolving.id, resolutionType, resolution);
      toast({ title: "Dispute resolved", description: resolutionType === "refund_buyer" ? "Buyer refunded" : "Payment released to publisher" });
      setResolving(null);
      setResolution("");
      fetchDisputes();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setProcessing(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div><h1 className="text-2xl font-bold text-foreground">Disputes</h1><p className="text-sm text-muted-foreground mt-1">{disputes.length} dispute{disputes.length !== 1 ? "s" : ""}</p></div>
      {disputes.length === 0 ? <div className="py-20 text-center text-muted-foreground">No disputes.</div> : (
        <div className="space-y-4">
          {disputes.map((d: any) => (
            <div key={d.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/10"><AlertTriangle className="h-5 w-5 text-warning" /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-sm">{d.orders?.title}</span>
                      <StatusBadge status={d.status} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{d.reason}</p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Buyer: {d.orders?.buyer?.full_name}</span>
                      <span>Publisher: {d.orders?.publisher?.full_name}</span>
                      <span>Website: {d.orders?.websites?.domain}</span>
                      <span className="text-primary font-medium">Amount: ${d.orders?.price}</span>
                    </div>
                    {d.resolution && <p className="text-xs text-success mt-2">Resolution: {d.resolution}</p>}
                    {d.resolution_type && <p className="text-xs text-muted-foreground">Action: {d.resolution_type === "refund_buyer" ? "Refunded to buyer" : "Released to publisher"}</p>}
                  </div>
                </div>
                {d.status === "open" && (
                  <Button size="sm" onClick={() => setResolving(d)}>Resolve</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!resolving} onOpenChange={() => setResolving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Dispute</DialogTitle>
            <DialogDescription>Choose how to resolve this dispute. Funds will be distributed accordingly.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm">
              <p className="text-muted-foreground">Order: <span className="text-foreground font-medium">{resolving?.orders?.title}</span></p>
              <p className="text-muted-foreground">Amount in escrow: <span className="text-primary font-bold">${resolving?.orders?.price}</span></p>
            </div>
            <div>
              <Label>Resolution notes</Label>
              <Textarea value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Explain the resolution..." className="mt-1 bg-secondary border-border" />
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => resolve("refund_buyer")} disabled={processing} className="flex-1 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10">
              {processing && <Loader2 className="h-3 w-3 animate-spin" />}
              <RefreshCw className="h-3 w-3" />Refund Buyer
            </Button>
            <Button onClick={() => resolve("release_publisher")} disabled={processing} className="flex-1 gap-1.5">
              {processing && <Loader2 className="h-3 w-3 animate-spin" />}
              <ArrowUpRight className="h-3 w-3" />Release to Publisher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
