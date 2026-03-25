import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: profiles } = await supabase.from("profiles").select("*, user_roles(role)").order("created_at", { ascending: false });
      setUsers(profiles || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = users.filter((u: any) => !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div><h1 className="text-2xl font-bold text-foreground">User Management</h1><p className="text-sm text-muted-foreground mt-1">{users.length} users</p></div>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-card border-border" />
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table><TableHeader><TableRow className="border-border hover:bg-transparent">
          <TableHead className="text-muted-foreground">User</TableHead><TableHead className="text-muted-foreground">Role</TableHead><TableHead className="text-muted-foreground">Joined</TableHead>
        </TableRow></TableHeader><TableBody>
          {filtered.map((u: any) => (
            <TableRow key={u.id} className="border-border">
              <TableCell><div><div className="font-medium text-foreground text-sm">{u.full_name || "—"}</div><div className="text-xs text-muted-foreground">{u.email}</div></div></TableCell>
              <TableCell className="text-sm text-muted-foreground capitalize">{u.user_roles?.[0]?.role || "—"}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody></Table>
      </div>
    </motion.div>
  );
}
