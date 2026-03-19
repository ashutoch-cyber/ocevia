import { motion } from "framer-motion";
import { Waves, Globe, Brain } from "lucide-react";

const stats = [
  { label: "Ocean Data Streams", value: "20+", icon: Waves },
  { label: "Coastal Zones Analyzed", value: "1000+", icon: Globe },
  { label: "Real-Time AI Risk Forecasting", value: "24/7", icon: Brain },
];

export default function Stats() {
  return (
    <section className="py-24 bg-card">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              whileHover={{ y: -6 }}
              className="bg-primary rounded-full py-6 px-8 flex items-center gap-4 shadow-lg hover:shadow-[0_12px_24px_rgba(0,0,0,0.2)] hover:brightness-110 transition-all duration-300 ease-out cursor-pointer group"
            >
              <s.icon className="w-8 h-8 text-secondary flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
              <div>
                <span className="text-2xl font-heading font-bold text-primary-foreground">
                  {s.value}
                </span>
                <p className="text-primary-foreground/70 text-sm">
                  {s.label}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
