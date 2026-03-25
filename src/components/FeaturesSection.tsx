import { motion } from "framer-motion";
import {
  Brain,
  Shield,
  BarChart3,
  Search,
  MessageSquare,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Quality Scoring",
    description: "Automated website evaluation using machine learning to detect PBNs, spam, and assess true SEO value.",
  },
  {
    icon: Search,
    title: "Smart Discovery",
    description: "AI-powered recommendations matching your campaign goals with the highest-performing publishers.",
  },
  {
    icon: Shield,
    title: "Secure Escrow",
    description: "Payment protection with automated escrow, commission management, and multi-gateway support.",
  },
  {
    icon: BarChart3,
    title: "Live Analytics",
    description: "Real-time dashboards tracking backlink performance, DA changes, traffic impact, and campaign ROI.",
  },
  {
    icon: MessageSquare,
    title: "In-App Messaging",
    description: "Seamless communication between advertisers and publishers with real-time notifications.",
  },
  {
    icon: Zap,
    title: "Automated Workflow",
    description: "End-to-end order management from content submission through approval to publication and payout.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const FeaturesSection = () => {
  return (
    <section id="features" className="relative py-32">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold md:text-5xl">
            Powered by <span className="text-gradient">Intelligence</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Every feature is designed to maximize your link-building ROI through AI and automation.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={item}
              className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-[var(--shadow-glow)]"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
