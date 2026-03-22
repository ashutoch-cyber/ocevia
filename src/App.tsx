import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import RiskMapPage from "./pages/RiskMapPage.jsx";
import DataSourcesPage from "./pages/DataSourcesPage.jsx";
import SearchResultsPage from "./pages/SearchResultsPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import { EventProvider } from "./context/EventContext";
import Chatbot from "./components/ChatBot";
const queryClient = new QueryClient();


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <EventProvider>
          <BrowserRouter>

            <Chatbot />

            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/risk-map" element={<RiskMapPage />} />
              <Route path="/data-sources" element={<DataSourcesPage />} />
              <Route path="/search" element={<SearchResultsPage />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="*" element={<NotFound />} />
            </Routes>

          </BrowserRouter>
        </EventProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;