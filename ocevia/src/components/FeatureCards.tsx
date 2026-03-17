import { Map, Bell, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    title: "Coastal Risk Map",
    desc: "Interactive geo-map visualizing AI-generated coastal risk scores based on oceanographic and climate data.",
    icon: Map,
  },
  {
    title: "Marine Alerts",
    desc: "Real-time alerts for fishing safety, environmental stress events, and pollution hotspots.",
    icon: Bell,
  },
  {
    title: "Ocean Insights",
    desc: "AI-driven analytics transforming complex marine datasets into actionable intelligence for coastal decision makers.",
    icon: BarChart3,
  },
];

export default function FeatureCards() {
  return (
    <section className="relative z-10 mt-12 md:mt-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8 md:mb-10">
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-primary">
            Services
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -6 }}
              className="p-8 rounded-2xl bg-card border border-secondary/10 shadow-lg hover:shadow-2xl hover:shadow-secondary/15 transition-all duration-[250ms] ease-out group cursor-pointer"
            >
              <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-secondary transition-colors duration-[250ms]">
                <f.icon className="w-6 h-6 text-primary group-hover:text-secondary-foreground transition-colors duration-[250ms]" />
              </div>
              <h3 className="font-heading font-bold text-xl text-primary mb-4">
                {f.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
