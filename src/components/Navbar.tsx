import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Menu, X } from "lucide-react";
import {
  filterSearchItems,
  getCategoryLabel,
  getInitialSearchIndex,
  loadSearchIndex,
  type SearchItem,
} from "@/lib/searchIndex";

const navLinks = ["Home", "Alerts", "Insights", "Data Sources"];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [allSearchItems, setAllSearchItems] = useState<SearchItem[]>(() => getInitialSearchIndex());
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";

  const liveResults = useMemo(() => {
    return filterSearchItems(allSearchItems, query, 8);
  }, [allSearchItems, query]);

  const shouldShowDropdown = isSearchFocused && query.trim().length > 0;
  const getSectionHref = (section: string) => {
    if (section === "Home") {
      return "/#";
    }

    const anchor = section.toLowerCase().replace(/\s/g, "-");
    return isHome ? `#${anchor}` : `/#${anchor}`;
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let mounted = true;

    loadSearchIndex().then((items) => {
      if (mounted) {
        setAllSearchItems(items);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!searchContainerRef.current) {
        return;
      }

      if (!searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const openSearchResultsPage = () => {
    const normalized = query.trim();
    navigate(`/search?q=${encodeURIComponent(normalized)}`);
    setIsSearchFocused(false);
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      openSearchResultsPage();
    }
  };

  const handleResultClick = (result: SearchItem) => {
    navigate(result.path);
    setQuery("");
    setIsSearchFocused(false);
  };

  return (
    <nav
      className={`${isHome ? "navbar home-navbar" : "navbar page-navbar"} transition-all duration-500 ${
        isHome
          ? isScrolled
            ? "bg-primary py-3 shadow-xl"
            : "py-5"
          : "py-3 shadow-xl"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/#" className="font-heading font-bold text-2xl tracking-[-0.02em] text-primary-foreground leading-none">
          NEER
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-8 text-primary-foreground/90 text-sm font-medium">
          {navLinks.map((item) => (
            item === "Data Sources" ? (
              <Link
                key={item}
                to="/data-sources"
                className="hover:text-secondary transition-colors"
              >
                {item}
              </Link>
            ) : (
              <a
                key={item}
                href={getSectionHref(item)}
                className="hover:text-secondary transition-colors"
              >
                {item}
              </a>
            )
          ))}
        </div>

        {/* Search */}
        <div ref={searchContainerRef} className="relative hidden md:block">
          <input
            type="text"
            placeholder="Search ocean data, alerts, regions..."
            className="bg-primary-foreground/10 border border-primary-foreground/20 rounded-full py-2 pl-10 pr-4 text-sm text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-secondary w-64 transition-all"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onKeyDown={handleInputKeyDown}
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-primary-foreground/50" />

          {shouldShowDropdown ? (
            <div className="absolute top-[calc(100%+10px)] left-0 w-80 rounded-2xl border border-primary-foreground/20 bg-primary p-2 shadow-xl z-[1100]">
              {liveResults.length === 0 ? (
                <div className="px-3 py-2 text-sm text-primary-foreground/80">No matches found</div>
              ) : (
                liveResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleResultClick(result)}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-primary-foreground/10 transition-colors"
                  >
                    <p className="text-xs uppercase tracking-wide text-secondary font-semibold mb-0.5">
                      {getCategoryLabel(result.category)}
                    </p>
                    <p className="text-sm text-primary-foreground font-medium leading-tight">{result.title}</p>
                  </button>
                ))
              )}

              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={openSearchResultsPage}
                className="w-full mt-1 text-left px-3 py-2 rounded-xl border border-primary-foreground/20 hover:bg-primary-foreground/10 transition-colors text-sm text-primary-foreground/90"
              >
                Show all results for "{query.trim()}"
              </button>
            </div>
          ) : null}
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
            item === "Data Sources" ? (
              <Link
                key={item}
                to="/data-sources"
                className="block text-primary-foreground/90 text-sm font-medium hover:text-secondary transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {item}
              </Link>
            ) : (
              <a
                key={item}
                href={getSectionHref(item)}
                className="block text-primary-foreground/90 text-sm font-medium hover:text-secondary transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {item}
              </a>
            )
          ))}
        </div>
      )}
    </nav>
  );
}
