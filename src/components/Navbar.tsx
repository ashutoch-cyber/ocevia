
import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Menu, X } from "lucide-react";

export default function Navbar({ logoutButton, setActiveIframe }) {
  const location = useLocation();
  const isHome = location.pathname === "/";

  const SEARCH_DATA = [
    { type: "location", name: "Puri Coast" },
    { type: "location", name: "Gopalpur Coast" },
    { type: "location", name: "Chilika Lake" },
    { type: "location", name: "Chandrabhaga Coast" },
    { type: "location", name: "Paradip Coast" },
    { type: "location", name: "Bay of Bengal" },
    { type: "location", name: "Singapore Port" },
    { type: "metric", name: "Wave Height" },
    { type: "metric", name: "Storm Surge" },
    { type: "keyword", name: "Ocean Risk Intelligence" }
  ];

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleChange = (value) => {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    const filtered = SEARCH_DATA.filter(item =>
      item.name.toLowerCase().includes(value.toLowerCase())
    );
    setResults(filtered);
    setShowDropdown(true);
  };

  return (
    <nav
      className={`navbar ${isHome ? "navbar-transparent" : "navbar-solid"}`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 40px",
        color: "white"
      }}
    >
      {/* LEFT: LOGO */}
      <div style={{ fontWeight: "bold", fontSize: "20px" }}>NEER</div>

      {/* CENTER: LINKS */}
      <div style={{ display: "flex", gap: "38px", alignItems: "center" }}>
        <a href="/#" style={{ color: "white", textDecoration: "none", fontWeight: 500 }}>Home</a>
        <a
          href="#"
          style={{ color: "white", textDecoration: "none", fontWeight: 500 }}
          onClick={e => {
            e.preventDefault();
            setActiveIframe({ title: "Marine Alerts", url: "https://ocean-forecasting-ml.onrender.com/" });
          }}
        >
          Alerts
        </a>
        <a
          href="#"
          style={{ color: "white", textDecoration: "none", fontWeight: 500 }}
          onClick={e => {
            e.preventDefault();
            setActiveIframe({ title: "Ocean Insights", url: "https://ohi-dashboard.onrender.com" });
          }}
        >
          Insights
        </a>
        <Link to="/data-sources" style={{ color: "white", textDecoration: "none", fontWeight: 500 }}>Data Sources</Link>
      </div>

      {/* RIGHT: SEARCH + LOGOUT */}
      <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
        {/* Ensure parent container has position: relative */}
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <Search style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", color: "#b2cbe6", width: 24, height: 24 }} />
          {/* STEP 4: UPDATE EXISTING INPUT FIELD */}
          <input
            className="search-input"
            placeholder="Search ocean data, alerts, regions..."
            style={{
              padding: "12px 24px 12px 52px",
              borderRadius: "28px",
              border: "2px solid #b2cbe6",
              background: "rgba(255,255,255,0.10)",
              fontSize: "17px",
              outline: "none",
              boxShadow: "0 2px 12px rgba(30,77,123,0.10)",
              width: 340,
              transition: "box-shadow 0.2s"
            }}
            value={query}
            onChange={e => handleChange(e.target.value)}
            onFocus={() => query && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          />
          {/* STEP 5: ADD DROPDOWN BELOW INPUT (KEEP POSITION) */}
          {showDropdown && results.length > 0 && (
            <div className="search-dropdown" style={{
              position: "absolute",
              top: "100%",
              left: 0,
              width: "100%",
              background: "#1f4f7f",
              borderRadius: 12,
              marginTop: 8,
              zIndex: 999
            }}>
              {results.map((item, index) => (
                <div
                  key={index}
                  className="search-item"
                  style={{
                    padding: 10,
                    cursor: "pointer"
                  }}
                  onClick={() => {
                    setQuery(item.name);
                    setShowDropdown(false);
                  }}
                >
                  <div className="type" style={{ fontSize: 10, color: "#7ec8ff" }}>{item.type.toUpperCase()}</div>
                  <div className="name" style={{ fontSize: 14, color: "white" }}>{item.name}</div>
                </div>
              ))}
              <div className="search-footer" style={{
                padding: 10,
                borderTop: "1px solid rgba(255,255,255,0.2)",
                opacity: 0.7
              }}>
                Show all results for "{query}"
              </div>
            </div>
          )}
        </div>
        {logoutButton}
      </div>
    </nav>
  );
}
