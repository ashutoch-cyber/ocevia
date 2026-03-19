const navLinks = ["Home", "Risk Map", "Alerts", "Insights", "Data Sources"];

export default function Footer() {
  return (
    <footer className="relative bg-primary overflow-hidden">
      {/* Wave SVG sitting flush at the top */}
      <div className="relative w-full leading-[0]">
        <svg
          viewBox="0 0 1440 160"
          preserveAspectRatio="none"
          className="block w-full h-[120px] md:h-[160px]"
        >
          <path
            d="M0,64 C360,160 720,-32 1080,80 C1260,120 1380,100 1440,96 L1440,160 L0,160 Z"
            className="fill-primary"
          />
          <path
            d="M0,96 C320,140 640,20 960,96 C1120,130 1320,110 1440,112 L1440,160 L0,160 Z"
            className="fill-primary"
            opacity="0.6"
          />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-12 grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
        <div>
          <h3 className="font-heading font-bold text-2xl text-primary-foreground mb-2">
            NEER
          </h3>
          <p className="text-secondary text-sm tracking-widest uppercase mb-6">
            AI Powered Ocean Risk Intelligence
          </p>
          <p className="text-primary-foreground/60 max-w-sm text-sm leading-relaxed">
            Leading the transition to data-driven marine safety and coastal
            resilience through advanced machine learning.
          </p>
        </div>

        <div className="flex flex-col md:items-end gap-8">
          <div className="w-full md:w-auto">
            <h4 className="text-primary-foreground font-semibold mb-4 md:text-right">
              Quick Links
            </h4>
            <div className="grid gap-3 text-primary-foreground/80 text-sm md:text-right">
              {navLinks.map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s/g, "-")}`}
                  className="hover:text-secondary transition-colors"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
          <p className="text-primary-foreground/40 text-xs mt-auto md:text-right">
            © 2026 NEER Ocean Intelligence Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
