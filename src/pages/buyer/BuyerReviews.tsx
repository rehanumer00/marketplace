import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i <= count ? "fill-warning text-warning" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
}

export default function BuyerReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState("");
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    const [reviewsRes, ordersRes] = await Promise.all([
      supabase.from("reviews").select("*, websites(domain)").eq("reviewer_id", user.id).order("created_at", { ascending: false }),
      supabase.from("orders").select("id, title, website_id, publisher_id, websites(domain)").eq("buyer_id", user.id).eq("status", "completed"),
    ]);

    const existingOrderIds = new Set((reviewsRes.data || []).map((r: any) => r.order_id));
    const unreviewedOrders = (ordersRes.data || []).filter((o: any) => !existingOrderIds.has(o.id));

    setReviews(reviewsRes.data || []);
    setCompletedOrders(unreviewedOrders);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const submitReview = async () => {
    if (!user || !selectedOrder) return;
    setSaving(true);
    const order = completedOrders.find((o: any) => o.id === selectedOrder);
    if (!order) { setSaving(false); return; }

    const { error } = await supabase.from("reviews").insert({
      order_id: selectedOrder,
      website_id: order.website_id,
      reviewer_id: user.id,
      publisher_id: order.publisher_id,
      rating: parseInt(rating),
      comment,
    });

    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Review submitted" }); setShowAdd(false); setComment(""); fetchData(); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Reviews</h1>
          <p className="text-sm text-muted-foreground mt-1">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
        </div>
        {completedOrders.length > 0 && <Button size="sm" onClick={() => setShowAdd(true)}>Write Review</Button>}
      </div>

      {reviews.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">No reviews yet. Complete an order to leave a review.</div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r: any) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-medium text-foreground text-sm">{r.websites?.domain}</span>
                  <div className="mt-1"><Stars count={r.rating} /></div>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              {r.comment && <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Write a Review</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Order</Label>
              <Select value={selectedOrder} onValueChange={setSelectedOrder}>
                <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue placeholder="Select order" /></SelectTrigger>
                <SelectContent>
                  {completedOrders.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.websites?.domain} – {o.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Rating</Label>
              <Select value={rating} onValueChange={setRating}>
                <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[5, 4, 3, 2, 1].map((r) => <SelectItem key={r} value={String(r)}>{r} Star{r !== 1 ? "s" : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Comment</Label>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} className="mt-1 bg-secondary border-border" placeholder="Share your experience..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={submitReview} disabled={saving || !selectedOrder}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
