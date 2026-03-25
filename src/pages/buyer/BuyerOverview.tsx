import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { ShoppingCart, Target, DollarSign, TrendingUp, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function BuyerOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ activeOrders: 0, totalSpent: 0, avgDA: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: orders } = await supabase
        .from("orders")
        .select("*, websites(domain, da)")
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });

      const allOrders = orders || [];
      const active = allOrders.filter((o: any) => !["completed", "cancelled"].includes(o.status));
      const totalSpent = allOrders.reduce((s: number, o: any) => s + Number(o.price), 0);
      const completedWithDA = allOrders.filter((o: any) => o.status === "completed" && o.websites?.da);
      const avgDA = completedWithDA.length ? completedWithDA.reduce((s: number, o: any) => s + o.websites.da, 0) / completedWithDA.length : 0;

      setStats({ activeOrders: active.length, totalSpent, avgDA: Math.round(avgDA) });
      setRecentOrders(allOrders.slice(0, 5));
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Buyer Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your link-building campaigns</p>
        </div>
        <Link to="/buyer/search"><Button className="gap-2">Find Publishers</Button></Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={ShoppingCart} title="Active Orders" value={String(stats.activeOrders)} />
        <StatCard icon={DollarSign} title="Total Spent" value={`$${stats.totalSpent.toFixed(2)}`} />
        <StatCard icon={TrendingUp} title="Avg. DA Acquired" value={String(stats.avgDA)} />
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="font-semibold text-foreground">Recent Orders</h2>
          <Link to="/buyer/orders"><Button variant="ghost" size="sm" className="text-primary">View All</Button></Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No orders yet. Browse the marketplace to get started.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Website</TableHead>
                <TableHead className="text-muted-foreground">Amount</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((o: any) => (
                <TableRow key={o.id} className="border-border">
                  <TableCell className="text-sm text-muted-foreground">{o.websites?.domain}</TableCell>
                  <TableCell className="text-sm font-medium text-foreground">${o.price}</TableCell>
                  <TableCell><StatusBadge status={o.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </motion.div>
  );
}
