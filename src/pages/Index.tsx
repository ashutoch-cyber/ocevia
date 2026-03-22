
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeatureCards from "@/components/FeatureCards";
import About from "@/components/About";
import NewsEvents from "@/components/NewsEvents";
import Stats from "@/components/Stats";
import Insights from "@/components/Insights";
import Footer from "@/components/Footer";
import { useState } from "react";


const Index = () => {
  const [activeIframe, setActiveIframe] = useState<{ title: string; url: string } | null>(null);
  return (
    <div className="min-h-screen bg-background font-body selection:bg-secondary/30">
      <Navbar logoutButton={null} setActiveIframe={setActiveIframe} />
      <main>
        <Hero />
        <FeatureCards activeIframe={activeIframe} setActiveIframe={setActiveIframe} />
        <About />
        <NewsEvents />
        <Stats />
        <Insights />
      </main>
      <Footer />
    </div>
  );
};

export default Index;