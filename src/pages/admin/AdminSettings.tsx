import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminSettings() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-2xl">
      <div><h1 className="text-2xl font-bold text-foreground">Platform Settings</h1></div>
      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        <h2 className="font-semibold text-foreground">Commission</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-muted-foreground text-sm">Platform Commission (%)</Label>
            <Input defaultValue="15" disabled className="mt-1.5 bg-secondary border-border opacity-60" />
            <p className="text-xs text-muted-foreground mt-1">Fixed at 15% per transaction</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
