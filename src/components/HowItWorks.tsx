import { motion } from "framer-motion";

const steps = [
  { step: "01", title: "Discover", description: "Search and filter thousands of verified publishers by niche, DA, traffic, and SEO metrics." },
  { step: "02", title: "Order", description: "Select websites, place orders, and submit your content through the automated workflow." },
  { step: "03", title: "Publish", description: "Publishers review and publish your content. Funds are held securely in escrow." },
  { step: "04", title: "Grow", description: "Track backlink performance, monitor DA changes, and scale winning campaigns with AI insights." },
];

const HowItWorks = () => {
  return (
    <section className="relative py-32 border-t border-border">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold md:text-5xl">How It Works</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            From discovery to ROI tracking — four simple steps.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="relative"
            >
              <span className="text-6xl font-black text-primary/10">{s.step}</span>
              <h3 className="mt-2 text-xl font-bold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
