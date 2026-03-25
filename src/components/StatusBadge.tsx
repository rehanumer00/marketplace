import { Badge } from "@/components/ui/badge";

const statusStyles: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  approved: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  completed: "bg-primary/10 text-primary border-primary/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  in_progress: "bg-info/10 text-info border-info/20",
  delivered: "bg-accent/10 text-accent-foreground border-accent/20",
  cancelled: "bg-muted text-muted-foreground border-border",
  disputed: "bg-destructive/10 text-destructive border-destructive/20",
  published: "bg-success/10 text-success border-success/20",
  draft: "bg-muted text-muted-foreground border-border",
  suspended: "bg-destructive/10 text-destructive border-destructive/20",
  open: "bg-warning/10 text-warning border-warning/20",
  resolved: "bg-primary/10 text-primary border-primary/20",
  paid: "bg-success/10 text-success border-success/20",
  processing: "bg-info/10 text-info border-info/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  escrow: "bg-warning/10 text-warning border-warning/20",
  released: "bg-success/10 text-success border-success/20",
  refunded: "bg-muted text-muted-foreground border-border",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={`text-xs capitalize ${statusStyles[status] || "bg-muted text-muted-foreground border-border"}`}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
