import { Outlet, useLocation, Navigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import {
  LayoutDashboard,
  Users,
  Globe,
  ShoppingCart,
  AlertTriangle,
  BarChart3,
  Settings,
  DollarSign,
} from "lucide-react";

const adminNav = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Listings", url: "/admin/listings", icon: Globe },
  { title: "Orders", url: "/admin/orders", icon: ShoppingCart },
  { title: "Transactions", url: "/admin/transactions", icon: DollarSign },
  { title: "Disputes", url: "/admin/disputes", icon: AlertTriangle },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

export default function AdminLayout() {
  return (
    <DashboardLayout
      navItems={adminNav}
      groupLabel="Administration"
      roleLabel="Admin"
      roleBadgeColor="bg-destructive/10 text-destructive"
    >
      <Outlet />
    </DashboardLayout>
  );
}
