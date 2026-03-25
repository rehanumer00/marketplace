import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ShoppingCart, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import StatusBadge from "@/components/StatusBadge";

export default function BuyerCampaigns() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, websites(domain, niche, da)")
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });
      setOrders(data || []);
      setLoading(false);
    };
    fetchOrders();
  }, [user]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  // Group orders by niche
  const nicheGroups: Record<string, any[]> = {};
  orders.forEach((o: any) => {
    const niche = o.websites?.niche || "Unknown";
    if (!nicheGroups[niche]) nicheGroups[niche] = [];
    nicheGroups[niche].push(o);
  });

  const niches = Object.entries(nicheGroups).sort((a, b) => b[1].length - a[1].length);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-1">Your orders grouped by niche</p>
        </div>
        <Link to="/buyer/search"><Button size="sm" className="gap-2"><ShoppingCart className="h-4 w-4" />Find Publishers</Button></Link>
      </div>

      {niches.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <p>No campaigns yet. Place orders to start building your link portfolio.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {niches.map(([niche, nicheOrders]) => {
            const completed = nicheOrders.filter((o: any) => o.status === "completed").length;
            const active = nicheOrders.filter((o: any) => !["completed", "cancelled"].includes(o.status)).length;
            const totalSpent = nicheOrders.reduce((s: number, o: any) => s + Number(o.price), 0);

            return (
              <div key={niche} className="rounded-xl border border-border bg-card">
                <div className="border-b border-border p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-foreground">{niche}</h2>
                      <p className="text-xs text-muted-foreground mt-1">{nicheOrders.length} orders · ${totalSpent.toFixed(2)} spent</p>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <span className="flex items-center gap-1 text-success"><CheckCircle className="h-3 w-3" />{completed} done</span>
                      <span className="flex items-center gap-1 text-warning"><Clock className="h-3 w-3" />{active} active</span>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {nicheOrders.map((o: any) => (
                    <div key={o.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="text-sm">
                          <span className="font-medium text-foreground">{o.websites?.domain}</span>
                          <span className="text-muted-foreground ml-2">DA {o.websites?.da}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-primary">${o.price}</span>
                        <StatusBadge status={o.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
