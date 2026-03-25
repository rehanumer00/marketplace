import { Outlet } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import {
  LayoutDashboard,
  Globe,
  ShoppingCart,
  DollarSign,
  MessageSquare,
  Star,
  Settings,
  PlusCircle,
} from "lucide-react";

const publisherNav = [
  { title: "Overview", url: "/publisher", icon: LayoutDashboard },
  { title: "My Websites", url: "/publisher/websites", icon: Globe },
  { title: "Add Website", url: "/publisher/add-website", icon: PlusCircle },
  { title: "Orders", url: "/publisher/orders", icon: ShoppingCart },
  { title: "Earnings", url: "/publisher/earnings", icon: DollarSign },
  { title: "Messages", url: "/publisher/messages", icon: MessageSquare },
  { title: "Reviews", url: "/publisher/reviews", icon: Star },
  { title: "Settings", url: "/publisher/settings", icon: Settings },
];

export default function PublisherLayout() {
  return (
    <DashboardLayout
      navItems={publisherNav}
      groupLabel="Publisher"
      roleLabel="Publisher"
      roleBadgeColor="bg-success/10 text-success"
    >
      <Outlet />
    </DashboardLayout>
  );
}
