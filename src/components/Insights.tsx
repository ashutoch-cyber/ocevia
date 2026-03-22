import { motion } from "framer-motion";
import insightMarine from "@/assets/insight-marine.jpg";
import insightPollution from "@/assets/insight-pollution.jpg";

const insights = [
  {
    title: "ML-Powered Ocean Risk Prediction",
    desc: "Machine learning models trained on buoy data predict wave heights, storm risks and fishing safety scores hours in advance",
    image: insightMarine,
  },
  {
    title: "Ocean Health Score Prediction",
    desc: "ML model analyses real-time parameters — water temperature,salinity, pH, dissolved oxygen and wave height — to generate a live ocean health score for every coastal zone in Odisha.",
    image: insightPollution,
  },
];

export default function Insights() {
  return (
    <section className="py-16 md:py-24 bg-background" id="insights">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl xs:text-3xl md:text-4xl font-heading font-bold text-primary mb-8 md:mb-12 tracking-[-0.02em] text-center">
          Ocean Insights
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
          {insights.map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -6 }}
              className="relative rounded-2xl overflow-hidden group cursor-pointer min-h-[260px] xs:min-h-[320px] md:min-h-[340px]"
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 min-h-[260px] xs:min-h-[320px] md:min-h-[340px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent" />
              <div className="absolute bottom-0 p-4 xs:p-8">
                <h3 className="font-heading font-bold text-lg xs:text-xl text-primary-foreground mb-1 xs:mb-2">
                  {item.title}
                </h3>
                <p className="text-primary-foreground/70 text-sm xs:text-base leading-relaxed">
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
