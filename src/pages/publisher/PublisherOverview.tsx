import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { Globe, ShoppingCart, DollarSign, Star, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

export default function PublisherOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ websites: 0, activeOrders: 0, earnings: 0, avgRating: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [websitesRes, ordersRes, transRes, reviewsRes] = await Promise.all([
        supabase.from("websites").select("id", { count: "exact" }).eq("publisher_id", user.id),
        supabase.from("orders").select("*, websites(domain), buyer:profiles!orders_buyer_id_fkey(full_name)").eq("publisher_id", user.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("transactions").select("publisher_amount").eq("publisher_id", user.id).eq("status", "released"),
        supabase.from("reviews").select("rating").eq("publisher_id", user.id),
      ]);

      const totalEarnings = (transRes.data || []).reduce((s: number, t: any) => s + Number(t.publisher_amount), 0);
      const avgRating = reviewsRes.data?.length ? (reviewsRes.data.reduce((s: number, r: any) => s + r.rating, 0) / reviewsRes.data.length) : 0;
      const activeOrders = (ordersRes.data || []).filter((o: any) => !["completed", "cancelled"].includes(o.status)).length;

      setStats({
        websites: websitesRes.count || 0,
        activeOrders,
        earnings: totalEarnings,
        avgRating,
      });
      setRecentOrders(ordersRes.data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Publisher Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your websites and track performance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Globe} title="My Websites" value={String(stats.websites)} />
        <StatCard icon={ShoppingCart} title="Active Orders" value={String(stats.activeOrders)} />
        <StatCard icon={DollarSign} title="Total Earnings" value={`$${stats.earnings.toFixed(2)}`} />
        <StatCard icon={Star} title="Avg. Rating" value={stats.avgRating.toFixed(1)} />
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="font-semibold text-foreground">Recent Orders</h2>
          <Link to="/publisher/orders"><Button variant="ghost" size="sm" className="text-primary">View All</Button></Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No orders yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Buyer</TableHead>
                <TableHead className="text-muted-foreground">Website</TableHead>
                <TableHead className="text-muted-foreground">Amount</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((o: any) => (
                <TableRow key={o.id} className="border-border">
                  <TableCell className="text-sm text-muted-foreground">{o.buyer?.full_name || "Unknown"}</TableCell>
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
