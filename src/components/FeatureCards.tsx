import { Map, Bell, BarChart3, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthModal from "@/components/AuthModal";
import { supabase } from "@/supabaseClient";

const features = [
  {
    title: "Coastal Risk Map",
    desc: "Interactive geo-map visualizing AI-generated coastal risk scores based on oceanographic and climate data.",
    icon: Map,
    href: "/risk-map",
    iframeUrl: null,
  },
  {
    title: "Marine Alerts",
    desc: "Real-time alerts for fishing safety, environmental stress events, and pollution hotspots.",
    icon: Bell,
    href: null,
    iframeUrl: "https://ocean-forecasting-ml.onrender.com/",
  },
  {
    title: "Ocean Insights",
    desc: "AI-driven analytics transforming complex marine datasets into actionable intelligence for coastal decision makers.",
    icon: BarChart3,
    href: null,
    iframeUrl: "https://ohi-dashboard.onrender.com",
  },
];

type Feature = (typeof features)[number];


export default function FeatureCards({ activeIframe, setActiveIframe }) {
  const [showAuth, setShowAuth] = useState(false);
  const navigate = useNavigate();

  const handleCardClick = async (f: Feature) => {
    if (f.href === "/risk-map") {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          navigate("/risk-map");
        } else {
          setShowAuth(true);
        }
      } catch {
        setShowAuth(true);
      }
    } else if (f.iframeUrl) {
      setActiveIframe({ title: f.title, url: f.iframeUrl });
    }
  };

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
              onClick={() => handleCardClick(f)}
              className="p-8 rounded-2xl bg-card border border-secondary/10 shadow-lg hover:shadow-2xl hover:shadow-secondary/15 transition-all duration-[250ms] ease-out group cursor-pointer"
            >
              <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-secondary transition-colors duration-[250ms]">
                <f.icon className="w-6 h-6 text-primary group-hover:text-secondary-foreground transition-colors duration-[250ms]" />
              </div>
              <h3 className="font-heading font-bold text-xl text-primary mb-4">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {activeIframe && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveIframe(null)}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-6xl h-[85vh] bg-card rounded-2xl overflow-hidden shadow-2xl border border-secondary/20"
              >
                <div className="flex items-center justify-between px-5 py-3 border-b border-secondary/10 bg-card">
                  <span className="font-heading font-bold text-primary text-lg">
                    {activeIframe.title}
                  </span>
                  <div className="flex items-center gap-3">
                    <a
                      href={activeIframe.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
                    >
                      Open in new tab ↗
                    </a>
                    <button
                      onClick={() => setActiveIframe(null)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary/20 transition-colors"
                    >
                      <X className="w-4 h-4 text-primary" />
                    </button>
                  </div>
                </div>
                <iframe
                  src={activeIframe.url}
                  title={activeIframe.title}
                  className="w-full h-[calc(100%-52px)] border-none"
                  allow="geolocation"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      </div>
    </section>
  );
}