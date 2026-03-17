import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeatureCards from "@/components/FeatureCards";
import About from "@/components/About";
import SamudraManthan from "@/components/SamudraManthan";
import Stats from "@/components/Stats";
import Insights from "@/components/Insights";
import Chatbot from "@/components/Chatbot";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background font-body selection:bg-secondary/30">
      <Navbar />
      <main>
        <Hero />
        <FeatureCards />
        <About />
        <SamudraManthan />
        <Stats />
        <Insights />
      </main>
      <Footer />
      <Chatbot />
    </div>
  );
};

export default Index;
