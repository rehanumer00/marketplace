import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import StatCard from "@/components/StatCard";
import { TrendingUp, Link2, Globe, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function BuyerAnalytics() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, websites(domain, da)")
        .eq("buyer_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false });
      setOrders(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const avgDA = orders.length ? Math.round(orders.reduce((s, o: any) => s + (o.websites?.da || 0), 0) / orders.length) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your backlink performance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Link2} title="Total Backlinks" value={String(orders.length)} />
        <StatCard icon={TrendingUp} title="Avg. DA" value={String(avgDA)} />
        <StatCard icon={Globe} title="Unique Domains" value={String(new Set(orders.map((o: any) => o.websites?.domain)).size)} />
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-5">
          <h2 className="font-semibold text-foreground">Backlink Portfolio</h2>
        </div>
        {orders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Complete orders to build your backlink portfolio.</div>
        ) : (
          <div className="divide-y divide-border">
            {orders.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Globe className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground">{o.websites?.domain}</span>
                    <span className="text-xs text-muted-foreground ml-2">DA {o.websites?.da}</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(o.completed_at || o.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
