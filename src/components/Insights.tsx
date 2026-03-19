import { motion } from "framer-motion";
import insightMarine from "@/assets/insight-marine.jpg";
import insightPollution from "@/assets/insight-pollution.jpg";

const insights = [
  {
    title: "Marine Ecosystem Health Monitoring",
    desc: "Tracking coral bleaching events and biodiversity indicators across critical ocean zones.",
    image: insightMarine,
  },
  {
    title: "Impact of Plastic Pollution",
    desc: "AI-powered detection and tracking of marine plastic pollution patterns and their ecological effects.",
    image: insightPollution,
  },
];

export default function Insights() {
  return (
    <section className="py-24 bg-background" id="insights">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl font-heading font-bold text-primary mb-12 tracking-[-0.02em] text-center">
          Ocean Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {insights.map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -6 }}
              className="relative rounded-2xl overflow-hidden group cursor-pointer h-80"
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent" />
              <div className="absolute bottom-0 p-8">
                <h3 className="font-heading font-bold text-xl text-primary-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-primary-foreground/70 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
