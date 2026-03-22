import { motion } from "framer-motion";
import samudraImage from "@/assets/samudra-manthan.jpg";

const bulletPoints = [
  "Collaboration between IIT Bhubaneswar, NIT Rourkela, Institute of Life Sciences, Fakir Mohan University, IISER Berhampur, and Berhampur University.",
  "Satellite imagery, GIS, and drone technology used for mapping coastal biodiversity and pollution.",
  "Research on marine algae, seagrass, fish species, and microorganisms with potential biomedical applications.",
  "Development of a marine bioresources atlas and microbial biorepository.",
  "Alignment with India's Blue Economy Policy to promote sustainable marine innovation.",
];

const highlights = [
  { value: "₹46,000 Crore", label: "5-Year Scientific Initiative" },
  { value: "574 km", label: "Odisha Coastline Studied" },
];

export default function SamudraManthan() {
  return (
    <section className="py-14 md:py-24 bg-card" id="samudra-manthan">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-start">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl xs:text-3xl md:text-4xl font-heading font-bold text-primary mb-2 tracking-[-0.02em]">
              Samudra Manthan Project
            </h2>
            <p className="text-secondary font-semibold text-sm uppercase tracking-widest mb-6">
              Strengthening Odisha's Blue Economy
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              The Samudra Manthan project is a five-year scientific initiative
              launched by the Government of Odisha to study marine bioresources
              along the state's 574-km coastline. The project focuses on mapping
              marine biodiversity, studying pollution patterns, and discovering
              bioactive marine compounds that could support pharmaceuticals,
              biotechnology, and sustainable coastal development.
            </p>
            <p className="text-muted-foreground font-semibold mb-3">
              Key aspects of the initiative include:
            </p>
            <ul className="space-y-2 xs:space-y-3 mb-6 xs:mb-8">
              {bulletPoints.map((point, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-muted-foreground text-sm leading-relaxed"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 flex-shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Right: Image + Highlight Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <img
              src={samudraImage}
              alt="Aerial view of coastal marine research along Odisha's coastline"
              className="rounded-2xl shadow-2xl shadow-primary/10 w-full"
            />
            <div className="bg-primary rounded-2xl p-6 flex flex-wrap gap-6">
              {highlights.map((h, i) => (
                <div key={i} className="flex-1 min-w-[140px]">
                  <span className="text-2xl font-heading font-bold text-cta block">
                    {h.value}
                  </span>
                  <span className="text-primary-foreground/70 text-sm">
                    {h.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
