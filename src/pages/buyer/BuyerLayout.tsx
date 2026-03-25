import { Outlet } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import {
  LayoutDashboard,
  Search,
  ShoppingCart,
  Target,
  MessageSquare,
  Star,
  BarChart3,
  Settings,
} from "lucide-react";

const buyerNav = [
  { title: "Overview", url: "/buyer", icon: LayoutDashboard },
  { title: "Find Publishers", url: "/buyer/search", icon: Search },
  { title: "My Orders", url: "/buyer/orders", icon: ShoppingCart },
  { title: "Campaigns", url: "/buyer/campaigns", icon: Target },
  { title: "Messages", url: "/buyer/messages", icon: MessageSquare },
  { title: "Analytics", url: "/buyer/analytics", icon: BarChart3 },
  { title: "Reviews", url: "/buyer/reviews", icon: Star },
  { title: "Settings", url: "/buyer/settings", icon: Settings },
];

export default function BuyerLayout() {
  return (
    <DashboardLayout
      navItems={buyerNav}
      groupLabel="Advertiser"
      roleLabel="Buyer"
      roleBadgeColor="bg-info/10 text-info"
    >
      <Outlet />
    </DashboardLayout>
  );
}
