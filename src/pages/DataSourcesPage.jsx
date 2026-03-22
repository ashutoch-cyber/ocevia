import Navbar from "@/components/Navbar";

const dataSources = [
  {
    icon: "🌊",
    title: "Copernicus Marine",
    description:
      "Provides satellite-based oceanographic data including sea temperature, currents, and marine conditions.",
    url: "https://marine.copernicus.eu/",
  },
  {
    icon: "🌐",
    title: "NOAA",
    description:
      "Delivers global ocean and atmospheric data including weather patterns, coastal monitoring, and marine safety insights.",
    url: "https://www.noaa.gov/",
  },
  {
    icon: "🛰",
    title: "NASA Earth Data",
    description:
      "Offers Earth observation data for environmental monitoring, climate analysis, and ocean ecosystem tracking.",
    url: "https://www.earthdata.nasa.gov/",
  },
  {
    icon: "☁️",
    title: "OpenWeather API",
    description:
      "Provides real-time weather, wind speed, and environmental data used for coastal risk analysis.",
    url: "https://openweathermap.org/",
  },
  {
    icon: "🗺",
    title: "Map API (Leaflet)",
    description:
      "Used to visualize geospatial coastal risk zones and interactive marine maps with Leaflet.",
    url: "https://leafletjs.com/",
  },
];

export default function DataSourcesPage() {
  return (
    <div className="min-h-screen bg-background font-body selection:bg-secondary/30">
      <Navbar />
      <main className="pb-16">
        <section className="page-container">
          <div className="max-w-3xl mb-10">
            <h1 className="font-heading font-bold text-4xl md:text-6xl text-primary mb-4 tracking-[-0.02em]">
              Data Sources
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Powering NEER with trusted global marine and environmental data platforms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dataSources.map((source) => (
              <a
                key={source.title}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary text-primary-foreground rounded-full py-6 px-8 min-h-[132px] shadow-lg hover:shadow-[0_12px_24px_rgba(0,0,0,0.2)] hover:brightness-110 transition-all duration-300 ease-out hover:-translate-y-1.5 cursor-pointer group flex flex-col justify-center overflow-hidden"
                style={{ borderRadius: "999px", textDecoration: "none" }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-2xl group-hover:scale-110 transition-transform duration-300" aria-hidden="true">
                    {source.icon}
                  </div>
                  <h2 className="font-heading font-bold text-2xl leading-tight">{source.title}</h2>
                </div>
                <p className="text-primary-foreground/80 text-sm leading-relaxed">
                  {source.description}
                </p>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
