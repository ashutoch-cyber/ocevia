import { motion } from "framer-motion";
import dashboardMockup from "@/assets/dashboard-mockup.png";

export default function About() {
  return (
    <section className="pt-10 md:pt-16 pb-14 md:pb-24 bg-background" id="about">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl xs:text-3xl md:text-5xl font-heading font-bold text-primary mb-4 md:mb-6 tracking-[-0.02em]">
            About NEER
          </h2>
          <p className="text-muted-foreground leading-relaxed text-base xs:text-lg mb-4 md:mb-6">
            NEER integrates ocean data from NASA, NOAA, Copernicus Marine and
            weather APIs, processes it through machine learning models, and
            generates predictive coastal risk intelligence.
          </p>
          <p className="text-muted-foreground leading-relaxed text-base xs:text-lg">
            Our platform empowers coastal communities, maritime operators, and
            environmental agencies with real-time situational awareness and
            data-driven decision support for marine safety and resilience.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <img
            src={dashboardMockup}
            alt="NEER Ocean Dashboard Mockup"
            className="rounded-2xl shadow-2xl shadow-primary/10 w-full max-w-xs sm:max-w-md md:max-w-lg mx-auto"
          />
        </motion.div>
      </div>
    </section>
  );
}
