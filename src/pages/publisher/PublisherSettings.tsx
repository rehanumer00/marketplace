import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function PublisherSettings() {
  const { profile, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [company, setCompany] = useState(profile?.company_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({ full_name: fullName, company_name: company, bio } as any);
    setSaving(false);
    if (error) toast({ title: "Error", description: String(error), variant: "destructive" });
    else toast({ title: "Settings saved" });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        <h2 className="font-semibold text-foreground">Profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-muted-foreground text-sm">Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1.5 bg-secondary border-border" />
          </div>
          <div>
            <Label className="text-muted-foreground text-sm">Email</Label>
            <Input value={profile?.email || ""} disabled className="mt-1.5 bg-secondary border-border opacity-60" />
          </div>
          <div>
            <Label className="text-muted-foreground text-sm">Company</Label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} className="mt-1.5 bg-secondary border-border" />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Save Changes
        </Button>
      </div>
    </motion.div>
  );
}
