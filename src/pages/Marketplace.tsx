import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Search, ExternalLink, TrendingUp, Globe, Star, SlidersHorizontal, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

interface Website {
  id: string;
  domain: string;
  da: number;
  dr: number;
  traffic: string;
  niche: string;
  price: number;
  avg_rating: number;
  turnaround_days: number;
  country: string;
  is_verified: boolean;
}

const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNiche, setSelectedNiche] = useState("All");
  const [daRange, setDaRange] = useState([0, 100]);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showFilters, setShowFilters] = useState(false);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [niches, setNiches] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchWebsites = async () => {
      const { data, error } = await supabase
        .from("websites")
        .select("*")
        .eq("status", "approved")
        .order("da", { ascending: false });

      if (data) {
        setWebsites(data as Website[]);
        const uniqueNiches = [...new Set(data.map((w: any) => w.niche))];
        setNiches(["All", ...uniqueNiches]);
      }
      setLoading(false);
    };
    fetchWebsites();
  }, []);

  const filtered = websites.filter((l) => {
    if (searchQuery && !l.domain.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedNiche !== "All" && l.niche !== selectedNiche) return false;
    if (l.da < daRange[0] || l.da > daRange[1]) return false;
    if (l.price < priceRange[0] || l.price > priceRange[1]) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-28 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold md:text-4xl">
            Explore <span className="text-gradient">Publishers</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            {loading ? "Loading..." : `${filtered.length} websites available for guest posts`}
          </p>
        </motion.div>

        <div className="mt-8 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by domain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>
          <Button variant="outline" className="gap-2 border-border" onClick={() => setShowFilters(!showFilters)}>
            {showFilters ? <X className="h-4 w-4" /> : <SlidersHorizontal className="h-4 w-4" />}
            Filters
          </Button>
        </div>

        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 rounded-xl border border-border bg-card p-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Niche</label>
                <Select value={selectedNiche} onValueChange={setSelectedNiche}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {niches.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">DA: {daRange[0]} – {daRange[1]}</label>
                <Slider min={0} max={100} step={1} value={daRange} onValueChange={setDaRange} className="mt-3" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Price: ${priceRange[0]} – ${priceRange[1]}</label>
                <Slider min={0} max={1000} step={10} value={priceRange} onValueChange={setPriceRange} className="mt-3" />
              </div>
            </div>
          </motion.div>
        )}

        <div className="mt-8 grid gap-4">
          {filtered.map((listing, i) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{listing.domain}</span>
                    {listing.is_verified && (
                      <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">Verified</Badge>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{listing.niche}</span>
                    <span>•</span>
                    <span>{listing.country}</span>
                    <span>•</span>
                    <span>{listing.turnaround_days} days</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 md:gap-6">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">DA</div>
                  <div className="text-lg font-bold text-foreground">{listing.da}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">DR</div>
                  <div className="text-lg font-bold text-foreground">{listing.dr}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Traffic</div>
                  <div className="flex items-center gap-1 text-lg font-bold text-foreground">
                    <TrendingUp className="h-3.5 w-3.5 text-success" />
                    {listing.traffic}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Rating</div>
                  <div className="flex items-center gap-1 text-lg font-bold text-foreground">
                    <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                    {Number(listing.avg_rating).toFixed(1)}
                  </div>
                </div>
                <div className="text-center min-w-[70px]">
                  <div className="text-xs text-muted-foreground">Price</div>
                  <div className="text-lg font-bold text-primary">${listing.price}</div>
                </div>
                {user ? (
                  <Link to={`/buyer/search?order=${listing.id}`}>
                    <Button size="sm" className="gap-1.5">
                      Order <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                ) : (
                  <Link to="/auth">
                    <Button size="sm" className="gap-1.5">
                      Order <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          ))}

          {!loading && filtered.length === 0 && (
            <div className="py-20 text-center text-muted-foreground">
              {websites.length === 0
                ? "No websites listed yet. Be the first publisher to list!"
                : "No listings match your filters. Try adjusting your criteria."}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Marketplace;
