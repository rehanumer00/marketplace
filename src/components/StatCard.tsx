import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changePositive?: boolean;
  icon: LucideIcon;
}

export default function StatCard({ title, value, change, changePositive, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{title}</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      <div className="mt-3 text-2xl font-bold text-foreground">{value}</div>
      {change && (
        <span className={`mt-1 inline-block text-xs font-medium ${changePositive ? "text-success" : "text-destructive"}`}>
          {change}
        </span>
      )}
    </div>
  );
}
