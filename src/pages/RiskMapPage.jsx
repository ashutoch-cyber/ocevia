import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import AuthModal from "../components/AuthModal";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import axios from "axios";
import Navbar from "@/components/Navbar";
import "../AppMapLegend.css";
import { useEffect as useLeafletEffect } from "react";
import { useMap } from "react-leaflet";

// Custom Legend Control
function MapLegendControl() {
  const map = useMap();
  useLeafletEffect(() => {
    const legend = L.DomUtil.create("div", "map-legend");
    legend.innerHTML = `
      <h4>Risk Index</h4>
      <div><span class="dot red"></span> Severe</div>
      <div><span class="dot orange"></span> Warning</div>
      <div><span class="dot yellow"></span> Watch</div>
      <div><span class="dot green"></span> Normal</div>
    `;
    const control = L.control({ position: "bottomleft" });
    control.onAdd = () => legend;
    control.addTo(map);
    return () => control.remove();
  }, [map]);
  return null;
}

const RiskMapPage = () => {
  const [showAuth, setShowAuth] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user && isMounted) {
        setShowAuth(true);
      }
    };
    checkSession();
    return () => { isMounted = false; };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (showAuth) {
    return <AuthModal isOpen={true} onClose={() => navigate("/")} />;
  }

  // ML risk data integration
  const [data, setData] = useState([]);
  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/predict/")
      .then(res => setData(res.data))
      .catch(() => setData([]));
  }, []);


  const RISK_COLORS = {
    Severe: "red",
    Warning: "orange",
    Watch: "gold",
    Normal: "green",
  };

  // Limit points for clarity
  const limitedPoints = data.slice(0, 150);


  return (
    <div className="risk-map-page min-h-screen bg-background font-body selection:bg-secondary/30">
      <Navbar logoutButton={
        <button
          onClick={handleLogout}
          style={{
            padding: "6px 12px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#0a84ff",
            color: "white",
            cursor: "pointer"
          }}
        >
          Logout
        </button>
      } />
      <main className="pb-16">
        <div className="page-container">
          <section>
            <div className="max-w-3xl mb-6 md:mb-8 mx-auto text-center">
              <h1 className="page-title font-heading font-bold text-4xl md:text-6xl text-primary mb-4 tracking-[-0.02em]">
                Cyclone Risk Map
              </h1>
              <p className="page-subtitle text-base md:text-lg text-muted-foreground leading-relaxed">
                Explore coastal risk levels across different regions using AI-powered analysis.
              </p>
            </div>
            <div
              className="map-container w-full rounded-2xl bg-card shadow-lg shadow-primary/10 border border-secondary/20 overflow-hidden"
              style={{ height: "100vh", width: "100%", position: "relative" }}
            >
              <MapContainer
                center={[16, 10]}
                zoom={2}
                style={{ height: "100%", width: "100%", borderRadius: "16px" }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {limitedPoints.map((point, idx) => (
                  <CircleMarker
                    key={idx}
                    center={[point.lat, point.lng]}
                    radius={3 + (point.risk === "Severe" ? 1 : 0)}
                    pathOptions={{
                      color: RISK_COLORS[point.risk] || "gray",
                      fillColor: RISK_COLORS[point.risk] || "gray",
                      fillOpacity: 0.6,
                      weight: 0.5,
                    }}
                  >
                    <Popup>
                      <b>Risk:</b> {point.risk}<br />
                      <b>Lat:</b> {point.lat.toFixed(2)}<br />
                      <b>Lng:</b> {point.lng.toFixed(2)}
                    </Popup>
                  </CircleMarker>
                ))}
                {/* Improved Legend as Leaflet Control */}
                <MapLegendControl />
              </MapContainer>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default RiskMapPage;
