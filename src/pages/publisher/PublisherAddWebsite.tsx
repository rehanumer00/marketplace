import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Globe, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const niches = ["Technology", "Health", "Finance", "Travel", "Marketing", "Food", "Crypto", "Education", "Lifestyle", "Other"];

export default function PublisherAddWebsite() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    domain: "",
    url: "",
    niche: "",
    price: "",
    turnaround_days: "7",
    description: "",
    content_guidelines: "",
    da: "0",
    dr: "0",
    traffic: "0",
    country: "US",
  });

  const handleSubmit = async () => {
    if (!user) return;
    if (!form.domain || !form.url || !form.niche || !form.price) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("websites").insert({
      publisher_id: user.id,
      domain: form.domain,
      url: form.url,
      niche: form.niche,
      price: parseFloat(form.price),
      turnaround_days: parseInt(form.turnaround_days),
      description: form.description,
      content_guidelines: form.content_guidelines,
      da: parseInt(form.da) || 0,
      dr: parseInt(form.dr) || 0,
      traffic: form.traffic || "0",
      country: form.country,
      status: "pending" as any,
    });
    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Website submitted", description: "Your listing is pending admin approval." });
      navigate("/publisher/websites");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link to="/publisher/websites">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add Website</h1>
          <p className="text-sm text-muted-foreground mt-1">List a new website on the marketplace</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <Globe className="h-5 w-5 text-primary shrink-0" />
          <p className="text-sm text-muted-foreground">
            Your listing will be reviewed by our team before going live on the marketplace.
          </p>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-foreground">Domain Name</Label>
              <Input placeholder="yourdomain.com" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} className="mt-1.5 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-foreground">Full URL</Label>
              <Input placeholder="https://yourdomain.com" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="mt-1.5 bg-secondary border-border" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-foreground">Niche</Label>
              <Select value={form.niche} onValueChange={(v) => setForm({ ...form, niche: v })}>
                <SelectTrigger className="mt-1.5 bg-secondary border-border"><SelectValue placeholder="Select niche" /></SelectTrigger>
                <SelectContent>
                  {niches.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-foreground">Price per Guest Post ($)</Label>
              <Input type="number" placeholder="150" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1.5 bg-secondary border-border" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label className="text-foreground">Domain Authority</Label>
              <Input type="number" placeholder="0" value={form.da} onChange={(e) => setForm({ ...form, da: e.target.value })} className="mt-1.5 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-foreground">Domain Rating</Label>
              <Input type="number" placeholder="0" value={form.dr} onChange={(e) => setForm({ ...form, dr: e.target.value })} className="mt-1.5 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-foreground">Monthly Traffic</Label>
              <Input placeholder="50K" value={form.traffic} onChange={(e) => setForm({ ...form, traffic: e.target.value })} className="mt-1.5 bg-secondary border-border" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-foreground">Turnaround Time</Label>
              <Select value={form.turnaround_days} onValueChange={(v) => setForm({ ...form, turnaround_days: v })}>
                <SelectTrigger className="mt-1.5 bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="5">5 days</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-foreground">Country</Label>
              <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="mt-1.5 bg-secondary border-border" />
            </div>
          </div>
          <div>
            <Label className="text-foreground">Description</Label>
            <Textarea placeholder="Describe your website, audience, and topics you cover..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1.5 bg-secondary border-border min-h-[80px]" />
          </div>
          <div>
            <Label className="text-foreground">Content Guidelines</Label>
            <Textarea placeholder="Requirements for guest post content..." value={form.content_guidelines} onChange={(e) => setForm({ ...form, content_guidelines: e.target.value })} className="mt-1.5 bg-secondary border-border min-h-[80px]" />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Link to="/publisher/websites"><Button variant="outline" className="border-border">Cancel</Button></Link>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Submit for Review
        </Button>
      </div>
    </motion.div>
  );
}
