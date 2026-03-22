const navLinks = ["Home", "Risk Map", "Alerts", "Insights", "Data Sources"];

export default function Footer() {
  return (
    <footer className="relative bg-primary overflow-hidden">
      {/* Wave SVG sitting flush at the top */}
      <div className="relative w-full leading-[0]">
        <svg
          viewBox="0 0 1440 160"
          preserveAspectRatio="none"
          className="block w-full h-[60px] md:h-[80px]"
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

      <div className="max-w-7xl mx-auto px-6 pb-4 grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
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

        <div className="flex flex-col items-center gap-4">
          <div className="w-full md:w-auto flex flex-col items-center">
            <h4 className="text-primary-foreground font-semibold mb-4 text-center">
              Quick Links
            </h4>
            <div className="flex flex-col items-center gap-3 text-primary-foreground/80 text-sm">
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
            <div className="w-full flex justify-end">
              <p className="text-primary-foreground/40 text-xs text-right mt-2">
                © 2026 NEER Ocean Intelligence Platform. All rights reserved.
              </p>
            </div>
        </div>
      </div>
    </footer>
  );
}
