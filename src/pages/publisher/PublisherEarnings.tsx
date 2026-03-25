import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import StatCard from "@/components/StatCard";
import { DollarSign, ArrowUpRight, Clock, Wallet, Loader2, BookOpen } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export default function PublisherEarnings() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;

    // Get wallet (or create)
    const { data: wallets } = await supabase.from("publisher_wallets").select("*").eq("publisher_id", user.id);
    const w = wallets?.[0] || { available_balance: 0, pending_balance: 0, withdrawn_balance: 0 };
    setWallet(w);

    // Get payouts
    const { data: p } = await supabase.from("payouts").select("*").eq("publisher_id", user.id).order("created_at", { ascending: false });
    setPayouts(p || []);

    // Get ledger if wallet exists
    if (wallets?.[0]?.id) {
      const { data: l } = await supabase.from("wallet_transactions").select("*").eq("wallet_id", wallets[0].id).order("created_at", { ascending: false }).limit(50);
      setLedger(l || []);
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  // Realtime wallet updates
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("publisher-wallet")
      .on("postgres_changes", { event: "*", schema: "public", table: "publisher_wallets", filter: `publisher_id=eq.${user.id}` }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const requestPayout = async () => {
    if (!user || !wallet || Number(wallet.available_balance) <= 0) return;
    const { error } = await supabase.from("payouts").insert({
      publisher_id: user.id,
      amount: wallet.available_balance,
      status: "pending" as any,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Payout requested", description: `$${Number(wallet.available_balance).toFixed(2)} payout pending admin approval.` });
      fetchData();
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const available = Number(wallet?.available_balance || 0);
  const pending = Number(wallet?.pending_balance || 0);
  const withdrawn = Number(wallet?.withdrawn_balance || 0);
  const total = available + withdrawn;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Earnings & Wallet</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your revenue, wallet balance, and payouts</p>
        </div>
        <Button className="gap-2" onClick={requestPayout} disabled={available <= 0}>
          <Wallet className="h-4 w-4" />Withdraw ${available.toFixed(2)}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={DollarSign} title="Total Earned" value={`$${total.toFixed(2)}`} />
        <StatCard icon={ArrowUpRight} title="Available" value={`$${available.toFixed(2)}`} />
        <StatCard icon={Clock} title="In Escrow" value={`$${pending.toFixed(2)}`} />
        <StatCard icon={Wallet} title="Withdrawn" value={`$${withdrawn.toFixed(2)}`} />
      </div>

      <Tabs defaultValue="payouts" className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="payouts">Payout History</TabsTrigger>
          <TabsTrigger value="ledger">Transaction Ledger</TabsTrigger>
        </TabsList>

        <TabsContent value="payouts">
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border p-5"><h2 className="font-semibold text-foreground">Payout History</h2></div>
            {payouts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No payouts yet.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Amount</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Notes</TableHead>
                    <TableHead className="text-muted-foreground">Requested</TableHead>
                    <TableHead className="text-muted-foreground">Processed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((p: any) => (
                    <TableRow key={p.id} className="border-border">
                      <TableCell className="text-sm font-medium text-primary">${Number(p.amount).toFixed(2)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground capitalize">{p.status}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.notes || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.processed_at ? new Date(p.processed_at).toLocaleDateString() : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="ledger">
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border p-5 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-foreground">Immutable Transaction Ledger</h2>
            </div>
            {ledger.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No wallet transactions yet.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Type</TableHead>
                    <TableHead className="text-muted-foreground">Amount</TableHead>
                    <TableHead className="text-muted-foreground">Balance After</TableHead>
                    <TableHead className="text-muted-foreground">Description</TableHead>
                    <TableHead className="text-muted-foreground">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.map((tx: any) => (
                    <TableRow key={tx.id} className="border-border">
                      <TableCell className="text-sm text-muted-foreground capitalize">{tx.type?.replace(/_/g, " ")}</TableCell>
                      <TableCell className={`text-sm font-medium ${Number(tx.amount) >= 0 ? "text-success" : "text-destructive"}`}>
                        {Number(tx.amount) >= 0 ? "+" : ""}${Number(tx.amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm text-foreground">${Number(tx.balance_after).toFixed(2)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{tx.description}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
