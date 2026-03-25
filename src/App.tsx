import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Marketplace from "./pages/Marketplace";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Admin
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminListings from "./pages/admin/AdminListings";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminDisputes from "./pages/admin/AdminDisputes";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";

// Publisher
import PublisherLayout from "./pages/publisher/PublisherLayout";
import PublisherOverview from "./pages/publisher/PublisherOverview";
import PublisherWebsites from "./pages/publisher/PublisherWebsites";
import PublisherAddWebsite from "./pages/publisher/PublisherAddWebsite";
import PublisherOrders from "./pages/publisher/PublisherOrders";
import PublisherEarnings from "./pages/publisher/PublisherEarnings";
import PublisherMessages from "./pages/publisher/PublisherMessages";
import PublisherReviews from "./pages/publisher/PublisherReviews";
import PublisherSettings from "./pages/publisher/PublisherSettings";

// Buyer
import BuyerLayout from "./pages/buyer/BuyerLayout";
import BuyerOverview from "./pages/buyer/BuyerOverview";
import BuyerSearch from "./pages/buyer/BuyerSearch";
import BuyerOrders from "./pages/buyer/BuyerOrders";
import BuyerCampaigns from "./pages/buyer/BuyerCampaigns";
import BuyerMessages from "./pages/buyer/BuyerMessages";
import BuyerAnalytics from "./pages/buyer/BuyerAnalytics";
import BuyerReviews from "./pages/buyer/BuyerReviews";
import BuyerSettings from "./pages/buyer/BuyerSettings";

const queryClient = new QueryClient();

function AuthRedirect() {
  const { user, role, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (role === "admin") return <Navigate to="/admin" replace />;
  if (role === "publisher") return <Navigate to="/publisher" replace />;
  if (role === "buyer") return <Navigate to="/buyer" replace />;
  return <Navigate to="/" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<AuthRedirect />} />

              {/* Admin Dashboard */}
              <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>}>
                <Route index element={<AdminOverview />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="listings" element={<AdminListings />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="transactions" element={<AdminTransactions />} />
                <Route path="disputes" element={<AdminDisputes />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              {/* Publisher Dashboard */}
              <Route path="/publisher" element={<ProtectedRoute requiredRole="publisher"><PublisherLayout /></ProtectedRoute>}>
                <Route index element={<PublisherOverview />} />
                <Route path="websites" element={<PublisherWebsites />} />
                <Route path="add-website" element={<PublisherAddWebsite />} />
                <Route path="orders" element={<PublisherOrders />} />
                <Route path="earnings" element={<PublisherEarnings />} />
                <Route path="messages" element={<PublisherMessages />} />
                <Route path="reviews" element={<PublisherReviews />} />
                <Route path="settings" element={<PublisherSettings />} />
              </Route>

              {/* Buyer Dashboard */}
              <Route path="/buyer" element={<ProtectedRoute requiredRole="buyer"><BuyerLayout /></ProtectedRoute>}>
                <Route index element={<BuyerOverview />} />
                <Route path="search" element={<BuyerSearch />} />
                <Route path="orders" element={<BuyerOrders />} />
                <Route path="campaigns" element={<BuyerCampaigns />} />
                <Route path="messages" element={<BuyerMessages />} />
                <Route path="analytics" element={<BuyerAnalytics />} />
                <Route path="reviews" element={<BuyerReviews />} />
                <Route path="settings" element={<BuyerSettings />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
