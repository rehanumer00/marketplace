import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, TrendingUp, ExternalLink, Edit, Plus, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function PublisherWebsites() {
  const { user } = useAuth();
  const [websites, setWebsites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("websites")
        .select("*")
        .eq("publisher_id", user.id)
        .order("created_at", { ascending: false });
      setWebsites(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Websites</h1>
          <p className="text-sm text-muted-foreground mt-1">{websites.length} website{websites.length !== 1 ? "s" : ""} listed</p>
        </div>
        <Link to="/publisher/add-website">
          <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Add Website</Button>
        </Link>
      </div>

      {websites.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <p>No websites yet. Add your first website to start receiving orders.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {websites.map((w) => (
            <div key={w.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{w.domain}</span>
                      <StatusBadge status={w.status === "approved" ? "active" : w.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{w.niche}</span>
                      <span>•</span>
                      <span>{w.total_orders || 0} orders</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-5">
                  <div className="text-center"><div className="text-xs text-muted-foreground">DA</div><div className="text-lg font-bold text-foreground">{w.da}</div></div>
                  <div className="text-center"><div className="text-xs text-muted-foreground">DR</div><div className="text-lg font-bold text-foreground">{w.dr}</div></div>
                  <div className="text-center"><div className="text-xs text-muted-foreground">Traffic</div><div className="flex items-center gap-1 text-lg font-bold text-foreground"><TrendingUp className="h-3.5 w-3.5 text-success" />{w.traffic}</div></div>
                  <div className="text-center"><div className="text-xs text-muted-foreground">Price</div><div className="text-lg font-bold text-primary">${w.price}</div></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
