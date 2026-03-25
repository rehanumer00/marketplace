import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import StatusBadge from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("orders").select("*, websites(domain), buyer:profiles!orders_buyer_id_fkey(full_name), publisher:profiles!orders_publisher_id_fkey(full_name), transactions(commission_amount)").order("created_at", { ascending: false });
      setOrders(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div><h1 className="text-2xl font-bold text-foreground">Orders</h1><p className="text-sm text-muted-foreground mt-1">{orders.length} total</p></div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-card border-border" /></div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table><TableHeader><TableRow className="border-border hover:bg-transparent">
          <TableHead className="text-muted-foreground">Buyer</TableHead><TableHead className="text-muted-foreground">Website</TableHead><TableHead className="text-muted-foreground">Amount</TableHead><TableHead className="text-muted-foreground">Commission</TableHead><TableHead className="text-muted-foreground">Status</TableHead><TableHead className="text-muted-foreground">Date</TableHead>
        </TableRow></TableHeader><TableBody>
          {orders.map((o: any) => (
            <TableRow key={o.id} className="border-border">
              <TableCell className="text-sm text-muted-foreground">{o.buyer?.full_name}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{o.websites?.domain}</TableCell>
              <TableCell className="text-sm font-medium text-foreground">${o.price}</TableCell>
              <TableCell className="text-sm text-primary">${o.transactions?.[0]?.commission_amount || "—"}</TableCell>
              <TableCell><StatusBadge status={o.status} /></TableCell>
              <TableCell className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody></Table>
      </div>
    </motion.div>
  );
}
