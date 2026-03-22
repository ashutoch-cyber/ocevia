
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

export default function Navbar({ logoutButton, setActiveIframe }) {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);

  // Responsive nav links
  const navLinks = [
    { label: "Home", href: "/#", onClick: undefined },
    { label: "Alerts", href: "#", onClick: (e) => { e.preventDefault(); setActiveIframe({ title: "Marine Alerts", url: "https://ocean-forecasting-ml.onrender.com/" }); } },
    { label: "Insights", href: "#", onClick: (e) => { e.preventDefault(); setActiveIframe({ title: "Ocean Insights", url: "https://ohi-dashboard.onrender.com" }); } },
    { label: "Data Sources", href: "/data-sources", onClick: undefined, isLink: true },
  ];

  return (
    <nav
      className={`navbar ${isHome ? "navbar-transparent" : "navbar-solid"} w-full fixed top-0 z-50 transition-all`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 md:py-4">
        {/* LEFT: LOGO */}
        <div className="font-bold text-lg md:text-2xl text-white select-none">NEER</div>

        {/* DESKTOP LINKS */}
        <div className="hidden md:flex items-center gap-6 lg:gap-10">
          {navLinks.map((item, idx) =>
            item.isLink ? (
              <Link
                key={item.label}
                to={item.href}
                className="text-white font-medium hover:text-secondary transition-colors text-base md:text-lg"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className="text-white font-medium hover:text-secondary transition-colors text-base md:text-lg"
                onClick={item.onClick}
              >
                {item.label}
              </a>
            )
          )}
        </div>

        {/* RIGHT: LOGOUT (desktop) */}
        <div className="hidden md:flex items-center gap-4">{logoutButton}</div>

        {/* MOBILE MENU BUTTON */}
        <button
          className="md:hidden flex items-center justify-center text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-secondary"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Open menu"
        >
          {mobileOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* MOBILE MENU DRAWER */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex flex-col">
          <div className="flex justify-end p-4">
            <button
              className="text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-secondary"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X size={28} />
            </button>
          </div>
          <div className="flex flex-col items-center gap-6 mt-8">
            {navLinks.map((item, idx) =>
              item.isLink ? (
                <Link
                  key={item.label}
                  to={item.href}
                  className="text-white font-semibold text-xl"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-white font-semibold text-xl"
                  onClick={e => {
                    if (item.onClick) item.onClick(e);
                    setMobileOpen(false);
                  }}
                >
                  {item.label}
                </a>
              )
            )}
            <div className="mt-6">{logoutButton}</div>
          </div>
        </div>
      )}
    </nav>
  );
}
