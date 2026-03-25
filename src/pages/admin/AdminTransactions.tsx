import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { DollarSign, ArrowDownLeft, Clock, Loader2, TrendingUp, Wallet } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { PaymentService } from "@/lib/payment";

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [stats, setStats] = useState({ volume: 0, escrow: 0, fees: 0, pendingPayouts: 0, refunded: 0 });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchAll = async () => {
    const [txRes, payoutRes] = await Promise.all([
      supabase.from("transactions").select("*, buyer:profiles!transactions_buyer_id_fkey(full_name), publisher:profiles!transactions_publisher_id_fkey(full_name)").order("created_at", { ascending: false }),
      supabase.from("payouts").select("*, publisher:profiles!payouts_publisher_id_fkey(full_name)").order("created_at", { ascending: false }),
    ]);

    const all = txRes.data || [];
    const volume = all.reduce((s: number, t: any) => s + Number(t.amount), 0);
    const escrow = all.filter((t: any) => ["escrow", "disputed"].includes(t.status)).reduce((s: number, t: any) => s + Number(t.amount), 0);
    const fees = all.filter((t: any) => t.status === "released").reduce((s: number, t: any) => s + Number(t.commission_amount), 0);
    const refunded = all.filter((t: any) => t.status === "refunded").reduce((s: number, t: any) => s + Number(t.amount), 0);
    const pendingPayouts = (payoutRes.data || []).filter((p: any) => p.status === "pending").reduce((s: number, p: any) => s + Number(p.amount), 0);

    setStats({ volume, escrow, fees, pendingPayouts, refunded });
    setTransactions(all);
    setPayouts(payoutRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handlePayout = async (payoutId: string, action: "approve" | "reject") => {
    setProcessing(payoutId);
    try {
      if (action === "approve") await PaymentService.approvePayout(payoutId);
      else await PaymentService.rejectPayout(payoutId);
      toast({ title: `Payout ${action}d` });
      fetchAll();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setProcessing(null);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const statusColor = (s: string) => {
    switch (s) {
      case "released": return "text-success";
      case "escrow": return "text-warning";
      case "disputed": return "text-destructive";
      case "refunded": return "text-muted-foreground";
      default: return "text-muted-foreground";
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div><h1 className="text-2xl font-bold text-foreground">Financial Overview</h1></div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={DollarSign} title="Total Volume" value={`$${stats.volume.toFixed(2)}`} />
        <StatCard icon={ArrowDownLeft} title="In Escrow" value={`$${stats.escrow.toFixed(2)}`} />
        <StatCard icon={TrendingUp} title="Commission Earned" value={`$${stats.fees.toFixed(2)}`} />
        <StatCard icon={Wallet} title="Pending Payouts" value={`$${stats.pendingPayouts.toFixed(2)}`} />
        <StatCard icon={Clock} title="Refunded" value={`$${stats.refunded.toFixed(2)}`} />
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="payouts">Payout Queue ({payouts.filter((p: any) => p.status === "pending").length})</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table><TableHeader><TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Buyer</TableHead>
              <TableHead className="text-muted-foreground">Publisher</TableHead>
              <TableHead className="text-muted-foreground">Amount</TableHead>
              <TableHead className="text-muted-foreground">Commission</TableHead>
              <TableHead className="text-muted-foreground">Publisher Gets</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Date</TableHead>
            </TableRow></TableHeader><TableBody>
              {transactions.map((t: any) => (
                <TableRow key={t.id} className="border-border">
                  <TableCell className="text-sm text-muted-foreground">{t.buyer?.full_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.publisher?.full_name}</TableCell>
                  <TableCell className="text-sm font-medium text-foreground">${Number(t.amount).toFixed(2)}</TableCell>
                  <TableCell className="text-sm text-primary">${Number(t.commission_amount).toFixed(2)}</TableCell>
                  <TableCell className="text-sm text-foreground">${Number(t.publisher_amount).toFixed(2)}</TableCell>
                  <TableCell className={`text-sm font-medium capitalize ${statusColor(t.status)}`}>{t.status}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody></Table>
          </div>
        </TabsContent>

        <TabsContent value="payouts">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table><TableHeader><TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Publisher</TableHead>
              <TableHead className="text-muted-foreground">Amount</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Requested</TableHead>
              <TableHead className="text-muted-foreground">Processed</TableHead>
              <TableHead />
            </TableRow></TableHeader><TableBody>
              {payouts.map((p: any) => (
                <TableRow key={p.id} className="border-border">
                  <TableCell className="text-sm text-muted-foreground">{p.publisher?.full_name}</TableCell>
                  <TableCell className="text-sm font-medium text-primary">${Number(p.amount).toFixed(2)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground capitalize">{p.status}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.processed_at ? new Date(p.processed_at).toLocaleDateString() : "—"}</TableCell>
                  <TableCell>
                    {p.status === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handlePayout(p.id, "approve")} disabled={processing === p.id}>
                          {processing === p.id && <Loader2 className="h-3 w-3 animate-spin mr-1" />}Approve & Pay
                        </Button>
                        <Button size="sm" variant="outline" className="border-border" onClick={() => handlePayout(p.id, "reject")} disabled={processing === p.id}>
                          Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody></Table>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
