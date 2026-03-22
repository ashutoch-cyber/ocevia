import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-ocean.jpg";
import AuthModal from "@/components/AuthModal";
import { supabase } from "@/supabaseClient";

export default function Hero() {
  const [showAuth, setShowAuth] = useState(false);
  const navigate = useNavigate();

  const withTimeout = (promise, ms) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Session check timed out")), ms);
      }),
    ]);
  };

  const handleExploreRiskMap = async () => {
    try {
      const {
        data: { session },
      } = await withTimeout(supabase.auth.getSession(), 3000);

      if (session?.user) {
        navigate("/risk-map");
        return;
      }

      setShowAuth(true);
    } catch (_error) {
      setShowAuth(true);
    }
  };

  return (
    <section className="hero-section relative min-h-[700px] flex items-center overflow-hidden pb-52">
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Sea turtle swimming above coral reef"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/50 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <h1 className="text-5xl md:text-7xl font-heading font-bold text-primary-foreground mb-6 leading-[1.1] tracking-[-0.02em]">
            AI Powered <br />
            <span className="text-gradient-ocean">
              Ocean Risk Intelligence
            </span>
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 leading-relaxed max-w-xl">
            Transforming fragmented marine data into predictive coastal risk
            insights, real-time alerts, and intelligent decision support.
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
            <button
              type="button"
              onClick={handleExploreRiskMap}
              className="bg-cta hover:bg-cta/90 text-accent-foreground font-bold px-8 py-4 rounded-full shadow-lg shadow-cta/20 transition-colors inline-block"
            >
              Explore Risk Map
            </button>
          </motion.div>
        </motion.div>
      </div>
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </section>
  );
}
