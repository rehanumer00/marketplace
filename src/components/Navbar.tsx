import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Globe, Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const dashboardPath = role === "admin" ? "/admin" : role === "publisher" ? "/publisher" : "/buyer";

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 glass"
    >
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Globe className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">LinkForge</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link to="/marketplace" className="text-sm text-muted-foreground transition hover:text-foreground">
            Marketplace
          </Link>
          <a href="#features" className="text-sm text-muted-foreground transition hover:text-foreground">
            Features
          </a>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {user ? (
            <>
              <Link to={dashboardPath}>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Dashboard
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground gap-1.5"
                onClick={async () => { await signOut(); navigate("/"); }}
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="sm" className="glow">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button className="text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border-t border-border px-6 py-4 md:hidden"
        >
          <div className="flex flex-col gap-3">
            <Link to="/marketplace" className="text-sm text-muted-foreground py-2">Marketplace</Link>
            <a href="#features" className="text-sm text-muted-foreground py-2">Features</a>
            <a href="#pricing" className="text-sm text-muted-foreground py-2">Pricing</a>
            {user ? (
              <>
                <Link to={dashboardPath}><Button size="sm" className="w-full mt-2">Dashboard</Button></Link>
                <Button size="sm" variant="outline" className="w-full" onClick={async () => { await signOut(); navigate("/"); }}>Sign Out</Button>
              </>
            ) : (
              <Link to="/auth"><Button size="sm" className="mt-2 w-full">Get Started</Button></Link>
            )}
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
