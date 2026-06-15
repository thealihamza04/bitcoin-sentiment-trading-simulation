import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import CaseStudy from "./pages/CaseStudy";
import TrainingSim from "./pages/TrainingSim";
import HowItWorks from "./pages/HowItWorks";
import Slides from "./pages/Slides";
import BrokerSim from "./pages/BrokerSim";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/training" element={<TrainingSim />} />
        <Route path="/case-study" element={<CaseStudy />} />
        <Route path="/slides" element={<Slides />} />
        <Route path="/brokers" element={<BrokerSim />} />
      </Routes>
    </BrowserRouter>
  );
}
