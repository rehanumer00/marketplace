import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, TrendingUp, Globe, Star, SlidersHorizontal, X, ShoppingCart, Loader2, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { PaymentService } from "@/lib/payment";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function BuyerSearch() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNiche, setSelectedNiche] = useState("All");
  const [daRange, setDaRange] = useState([0, 100]);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showFilters, setShowFilters] = useState(false);
  const [websites, setWebsites] = useState<any[]>([]);
  const [niches, setNiches] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);
  const [orderWebsite, setOrderWebsite] = useState<any>(null);
  const [orderForm, setOrderForm] = useState({ title: "", description: "", target_url: "", anchor_text: "" });
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("websites")
        .select("*")
        .eq("status", "approved")
        .order("da", { ascending: false });
      if (data) {
        setWebsites(data);
        const uniqueNiches = [...new Set(data.map((w: any) => w.niche))];
        setNiches(["All", ...uniqueNiches]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = websites.filter((l: any) => {
    if (searchQuery && !l.domain.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedNiche !== "All" && l.niche !== selectedNiche) return false;
    if (l.da < daRange[0] || l.da > daRange[1]) return false;
    if (l.price < priceRange[0] || l.price > priceRange[1]) return false;
    return true;
  });

  const placeOrder = async () => {
    if (!user || !orderWebsite) return;
    if (!orderForm.title.trim()) { toast({ title: "Title required", variant: "destructive" }); return; }
    setPlacing(true);
    try {
      await PaymentService.placeOrder({
        website_id: orderWebsite.id,
        title: orderForm.title.trim(),
        description: orderForm.description || undefined,
        target_url: orderForm.target_url || undefined,
        anchor_text: orderForm.anchor_text || undefined,
      });
      toast({ title: "Order placed!", description: "Payment held in escrow. The publisher will be notified." });
      setOrderWebsite(null);
      setOrderForm({ title: "", description: "", target_url: "", anchor_text: "" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setPlacing(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Find Publishers</h1>
        <p className="text-sm text-muted-foreground mt-1">{filtered.length} websites available</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by domain..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-card border-border" />
        </div>
        <Button variant="outline" className="gap-2 border-border" onClick={() => setShowFilters(!showFilters)}>
          {showFilters ? <X className="h-4 w-4" /> : <SlidersHorizontal className="h-4 w-4" />}
          Filters
        </Button>
      </div>

      {showFilters && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="rounded-xl border border-border bg-card p-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Niche</label>
              <Select value={selectedNiche} onValueChange={setSelectedNiche}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>{niches.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">DA: {daRange[0]} – {daRange[1]}</label>
              <Slider min={0} max={100} step={1} value={daRange} onValueChange={setDaRange} className="mt-3" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Price: ${priceRange[0]} – ${priceRange[1]}</label>
              <Slider min={0} max={1000} step={10} value={priceRange} onValueChange={setPriceRange} className="mt-3" />
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid gap-4">
        {filtered.map((listing: any, i: number) => (
          <motion.div key={listing.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary"><Globe className="h-5 w-5" /></div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{listing.domain}</span>
                  {listing.is_verified && <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">Verified</Badge>}
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{listing.niche}</span><span>•</span><span>{listing.country}</span><span>•</span><span>{listing.turnaround_days}d</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 md:gap-6">
              <div className="text-center"><div className="text-xs text-muted-foreground">DA</div><div className="text-lg font-bold text-foreground">{listing.da}</div></div>
              <div className="text-center"><div className="text-xs text-muted-foreground">DR</div><div className="text-lg font-bold text-foreground">{listing.dr}</div></div>
              <div className="text-center"><div className="text-xs text-muted-foreground">Traffic</div><div className="flex items-center gap-1 text-lg font-bold text-foreground"><TrendingUp className="h-3.5 w-3.5 text-success" />{listing.traffic}</div></div>
              <div className="text-center"><div className="text-xs text-muted-foreground">Rating</div><div className="flex items-center gap-1 text-lg font-bold text-foreground"><Star className="h-3.5 w-3.5 fill-warning text-warning" />{Number(listing.avg_rating).toFixed(1)}</div></div>
              <div className="text-center min-w-[70px]"><div className="text-xs text-muted-foreground">Price</div><div className="text-lg font-bold text-primary">${listing.price}</div></div>
              <Button size="sm" className="gap-1.5" onClick={() => setOrderWebsite(listing)}>
                <ShoppingCart className="h-3.5 w-3.5" />Order
              </Button>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && <div className="py-20 text-center text-muted-foreground">No listings match your filters.</div>}
      </div>

      {/* Order Dialog */}
      <Dialog open={!!orderWebsite} onOpenChange={() => setOrderWebsite(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Place Order – {orderWebsite?.domain}</DialogTitle>
            <DialogDescription>Your payment will be held in secure escrow until you approve delivery.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-primary shrink-0" />
              <span className="text-muted-foreground">Payment held in <span className="text-primary font-medium">secure escrow</span> until you approve delivery</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order Price</span>
              <span className="font-bold text-primary">${orderWebsite?.price}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Platform fee (15%)</span>
              <span className="text-muted-foreground">${(Number(orderWebsite?.price || 0) * 0.15).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-border pt-2">
              <span className="text-muted-foreground">Publisher receives</span>
              <span className="font-medium text-foreground">${(Number(orderWebsite?.price || 0) * 0.85).toFixed(2)}</span>
            </div>
            <div>
              <Label>Article Title *</Label>
              <Input value={orderForm.title} onChange={(e) => setOrderForm({ ...orderForm, title: e.target.value })} placeholder="Your article title" className="mt-1 bg-secondary border-border" />
            </div>
            <div>
              <Label>Target URL</Label>
              <Input value={orderForm.target_url} onChange={(e) => setOrderForm({ ...orderForm, target_url: e.target.value })} placeholder="https://yoursite.com/page" className="mt-1 bg-secondary border-border" />
            </div>
            <div>
              <Label>Anchor Text</Label>
              <Input value={orderForm.anchor_text} onChange={(e) => setOrderForm({ ...orderForm, anchor_text: e.target.value })} placeholder="Your anchor text" className="mt-1 bg-secondary border-border" />
            </div>
            <div>
              <Label>Description / Instructions</Label>
              <Textarea value={orderForm.description} onChange={(e) => setOrderForm({ ...orderForm, description: e.target.value })} placeholder="Any specific requirements..." className="mt-1 bg-secondary border-border" />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setOrderWebsite(null)}>Cancel</Button>
            <Button onClick={placeOrder} disabled={placing}>
              {placing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Pay & Place Order (${orderWebsite?.price})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
