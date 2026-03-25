import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import StatCard from "@/components/StatCard";
import { DollarSign, ShoppingCart, Users, Globe, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function AdminAnalytics() {
  const [stats, setStats] = useState({ revenue: 0, orders: 0, users: 0, websites: 0 });
  const [nicheData, setNicheData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [transRes, ordersRes, usersRes, websitesRes] = await Promise.all([
        supabase.from("transactions").select("commission_amount").eq("status", "released"),
        supabase.from("orders").select("id", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("websites").select("niche").eq("status", "approved"),
      ]);
      const revenue = (transRes.data || []).reduce((s: number, t: any) => s + Number(t.commission_amount), 0);
      setStats({ revenue, orders: ordersRes.count || 0, users: usersRes.count || 0, websites: (websitesRes.data || []).length });

      // Niche distribution
      const nicheCounts: Record<string, number> = {};
      (websitesRes.data || []).forEach((w: any) => { nicheCounts[w.niche] = (nicheCounts[w.niche] || 0) + 1; });
      const total = Object.values(nicheCounts).reduce((s, c) => s + c, 0) || 1;
      setNicheData(Object.entries(nicheCounts).map(([niche, count]) => ({ niche, count, pct: Math.round((count / total) * 100) })).sort((a, b) => b.count - a.count));
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div><h1 className="text-2xl font-bold text-foreground">Analytics</h1></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={DollarSign} title="Platform Revenue" value={`$${stats.revenue.toFixed(2)}`} />
        <StatCard icon={ShoppingCart} title="Total Orders" value={String(stats.orders)} />
        <StatCard icon={Users} title="Total Users" value={String(stats.users)} />
        <StatCard icon={Globe} title="Active Listings" value={String(stats.websites)} />
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold text-foreground mb-6">Niche Distribution</h2>
        {nicheData.length === 0 ? <p className="text-muted-foreground text-sm">No data yet.</p> : (
          <div className="space-y-4">
            {nicheData.map((n) => (
              <div key={n.niche}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-foreground">{n.niche}</span>
                  <span className="text-xs text-muted-foreground">{n.count} ({n.pct}%)</span>
                </div>
                <div className="h-2 rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${n.pct}%` }} /></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
