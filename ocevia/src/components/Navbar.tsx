import { useState, useEffect } from "react";
import { Search, Menu, X } from "lucide-react";

const navLinks = ["Home", "Alerts", "Insights", "Data Sources"];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-primary py-3 shadow-xl"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <div>
          <span className="font-heading font-bold text-2xl tracking-[-0.02em] text-primary-foreground leading-none">
            NEER
          </span>
        </div>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-8 text-primary-foreground/90 text-sm font-medium">
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

        {/* Search */}
        <div className="relative hidden md:block">
          <input
            type="text"
            placeholder="Search ocean data, alerts, regions..."
            className="bg-primary-foreground/10 border border-primary-foreground/20 rounded-full py-2 pl-10 pr-4 text-sm text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-secondary w-64 transition-all"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-primary-foreground/50" />
        </div>

        {/* Mobile toggle */}
        <button
          className="lg:hidden text-primary-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-primary/95 backdrop-blur-md px-6 pb-6 pt-2 space-y-4">
          {navLinks.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s/g, "-")}`}
              className="block text-primary-foreground/90 text-sm font-medium hover:text-secondary transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {item}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
