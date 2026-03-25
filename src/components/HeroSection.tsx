import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const HeroSection = () => {
  const { user, role } = useAuth();
  const dashboardPath = role === "admin" ? "/admin" : role === "publisher" ? "/publisher" : "/buyer";

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full opacity-40 blur-[120px]"
        style={{ background: "radial-gradient(circle, hsl(172 66% 50% / 0.3), transparent 70%)" }}
      />
      <div
        className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full opacity-20 blur-[100px]"
        style={{ background: "radial-gradient(circle, hsl(260 60% 50% / 0.3), transparent 70%)" }}
      />

      <div className="container relative z-10 mx-auto px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Guest Post Marketplace
          </div>

          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold leading-[1.1] md:text-7xl">
            Build Authority with{" "}
            <span className="text-gradient">Intelligent</span>{" "}
            Backlinks
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Connect with premium publishers, automate SEO analysis, and scale your
            link-building campaigns with AI-driven insights and secure escrow payments.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/marketplace">
              <Button size="lg" className="glow gap-2 px-8 text-base">
                Browse Marketplace
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            {user ? (
              <Link to={dashboardPath}>
                <Button variant="outline" size="lg" className="gap-2 px-8 text-base border-border text-foreground hover:bg-secondary">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="lg" className="gap-2 px-8 text-base border-border text-foreground hover:bg-secondary">
                  List Your Website
                </Button>
              </Link>
            )}
          </div>

          <div className="mt-16 flex items-center justify-center gap-8 text-sm text-muted-foreground md:gap-12">
            <div>
              <span className="block text-2xl font-bold text-foreground">12K+</span>
              Publishers
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <span className="block text-2xl font-bold text-foreground">850K+</span>
              Backlinks Placed
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <span className="block text-2xl font-bold text-foreground">98%</span>
              Satisfaction
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
