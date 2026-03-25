import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function AdminListings() {
  const [listings, setListings] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchListings = async () => {
    const { data } = await supabase.from("websites").select("*, publisher:profiles!websites_publisher_id_fkey(full_name)").order("created_at", { ascending: false });
    setListings(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchListings(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("websites").update({ status: status as any }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: `Listing ${status}` }); fetchListings(); }
  };

  const filtered = listings.filter((l: any) => !search || l.domain.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div><h1 className="text-2xl font-bold text-foreground">Listings</h1><p className="text-sm text-muted-foreground mt-1">{listings.length} total</p></div>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search listings..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-card border-border" />
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table><TableHeader><TableRow className="border-border hover:bg-transparent">
          <TableHead className="text-muted-foreground">Domain</TableHead><TableHead className="text-muted-foreground">Publisher</TableHead>
          <TableHead className="text-muted-foreground">DA</TableHead><TableHead className="text-muted-foreground">Price</TableHead>
          <TableHead className="text-muted-foreground">Status</TableHead><TableHead />
        </TableRow></TableHeader><TableBody>
          {filtered.map((l: any) => (
            <TableRow key={l.id} className="border-border">
              <TableCell className="font-medium text-foreground text-sm">{l.domain}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{l.publisher?.full_name}</TableCell>
              <TableCell className="text-sm text-foreground">{l.da}</TableCell>
              <TableCell className="text-sm text-primary">${l.price}</TableCell>
              <TableCell><StatusBadge status={l.status === "approved" ? "active" : l.status} /></TableCell>
              <TableCell>
                {l.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateStatus(l.id, "approved")}>Approve</Button>
                    <Button size="sm" variant="outline" className="border-border" onClick={() => updateStatus(l.id, "rejected")}>Reject</Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody></Table>
      </div>
    </motion.div>
  );
}
