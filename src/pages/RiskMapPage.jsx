import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, TileLayer } from "react-leaflet";
import Navbar from "@/components/Navbar";

const fallbackRiskPoints = [
  { lat: 19.4, lng: 72.8, risk: "medium" },
  { lat: 21.1, lng: 87.2, risk: "high" },
  { lat: 15.2, lng: 73.5, risk: "low" },
  { lat: 34.0, lng: -118.3, risk: "medium" },
  { lat: 40.6, lng: -73.9, risk: "high" },
  { lat: 51.0, lng: -1.2, risk: "low" },
  { lat: 6.2, lng: 3.3, risk: "medium" },
  { lat: 35.6, lng: 139.7, risk: "high" },
  { lat: 1.3, lng: 103.8, risk: "medium" },
  { lat: -33.9, lng: 151.2, risk: "low" },
];

const RiskMapPage = () => {
  const [riskPoints, setRiskPoints] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/risk/")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`API error ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("API DATA:", data);
        if (Array.isArray(data) && data.length > 0) {
          setRiskPoints(data);
          return;
        }
        setRiskPoints(fallbackRiskPoints);
      })
      .catch((err) => {
        console.error(err);
        setRiskPoints(fallbackRiskPoints);
      });
  }, []);

  const getColor = (risk) => {
    if (risk === "high") return "#ff3b3b";
    if (risk === "medium") return "#ffc107";
    return "#28a745";
  };

  return (
    <div className="risk-map-page min-h-screen bg-background font-body selection:bg-secondary/30">
      <Navbar />
      <main className="pb-16">
        <div className="page-container">
          <section>
            <div className="max-w-3xl mb-6 md:mb-8 mx-auto text-center">
              <h1 className="page-title font-heading font-bold text-4xl md:text-6xl text-primary mb-4 tracking-[-0.02em]">
                Risk Map
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

                {riskPoints.map((point, index) => (
                  <CircleMarker
                    key={index}
                    center={[point.lat, point.lng]}
                    radius={4}
                    pathOptions={{
                      color: getColor(point.risk),
                      fillColor: getColor(point.risk),
                      fillOpacity: 0.9,
                    }}
                  />
                ))}
              </MapContainer>

              <div
                style={{
                  position: "absolute",
                  bottom: "20px",
                  left: "20px",
                  background: "white",
                  padding: "15px 20px",
                  borderRadius: "20px",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                  border: "2px solid black",
                  zIndex: 1000,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                  <span
                    style={{
                      height: "15px",
                      width: "15px",
                      backgroundColor: "red",
                      borderRadius: "50%",
                      display: "inline-block",
                      marginRight: "10px",
                    }}
                  ></span>
                  <strong>HIGH RISK</strong>
                </div>

                <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                  <span
                    style={{
                      height: "15px",
                      width: "15px",
                      backgroundColor: "orange",
                      borderRadius: "50%",
                      display: "inline-block",
                      marginRight: "10px",
                    }}
                  ></span>
                  <strong>MEDIUM RISK</strong>
                </div>

                <div style={{ display: "flex", alignItems: "center" }}>
                  <span
                    style={{
                      height: "15px",
                      width: "15px",
                      backgroundColor: "green",
                      borderRadius: "50%",
                      display: "inline-block",
                      marginRight: "10px",
                    }}
                  ></span>
                  <strong>LOW RISK</strong>
                </div>
              </div>

            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default RiskMapPage;
