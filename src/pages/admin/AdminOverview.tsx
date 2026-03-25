import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { Users, Globe, ShoppingCart, DollarSign, AlertTriangle, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

export default function AdminOverview() {
  const [stats, setStats] = useState({ users: 0, websites: 0, orders: 0, revenue: 0, disputes: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [usersRes, websitesRes, ordersRes, transRes, disputesRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("websites").select("id", { count: "exact" }).eq("status", "approved"),
        supabase.from("orders").select("*, websites(domain), buyer:profiles!orders_buyer_id_fkey(full_name), publisher:profiles!orders_publisher_id_fkey(full_name)").order("created_at", { ascending: false }).limit(5),
        supabase.from("transactions").select("commission_amount").eq("status", "released"),
        supabase.from("disputes").select("id", { count: "exact" }).eq("status", "open"),
      ]);
      const revenue = (transRes.data || []).reduce((s: number, t: any) => s + Number(t.commission_amount), 0);
      setStats({ users: usersRes.count || 0, websites: websitesRes.count || 0, orders: (ordersRes.data || []).length, revenue, disputes: disputesRes.count || 0 });
      setRecentOrders(ordersRes.data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div><h1 className="text-2xl font-bold text-foreground">Platform Overview</h1><p className="text-sm text-muted-foreground mt-1">Monitor and manage your marketplace</p></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} title="Total Users" value={String(stats.users)} />
        <StatCard icon={Globe} title="Active Listings" value={String(stats.websites)} />
        <StatCard icon={ShoppingCart} title="Total Orders" value={String(stats.orders)} />
        <StatCard icon={DollarSign} title="Commission Earned" value={`$${stats.revenue.toFixed(2)}`} />
      </div>
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="font-semibold text-foreground">Recent Orders</h2>
          <Link to="/admin/orders"><Button variant="ghost" size="sm" className="text-primary">View All</Button></Link>
        </div>
        {recentOrders.length === 0 ? <div className="p-8 text-center text-muted-foreground text-sm">No orders yet.</div> : (
          <Table><TableHeader><TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground">Buyer</TableHead><TableHead className="text-muted-foreground">Website</TableHead><TableHead className="text-muted-foreground">Amount</TableHead><TableHead className="text-muted-foreground">Status</TableHead>
          </TableRow></TableHeader><TableBody>
            {recentOrders.map((o: any) => (
              <TableRow key={o.id} className="border-border">
                <TableCell className="text-sm text-muted-foreground">{o.buyer?.full_name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{o.websites?.domain}</TableCell>
                <TableCell className="text-sm font-medium text-foreground">${o.price}</TableCell>
                <TableCell><StatusBadge status={o.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        )}
      </div>
      {stats.disputes > 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <div><h3 className="font-semibold text-foreground text-sm">{stats.disputes} Open Dispute{stats.disputes !== 1 ? "s" : ""}</h3></div>
            <Link to="/admin/disputes" className="ml-auto"><Button size="sm" variant="outline" className="border-warning/30 text-warning hover:bg-warning/10">Review</Button></Link>
          </div>
        </div>
      )}
    </motion.div>
  );
}
