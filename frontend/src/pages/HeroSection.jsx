import { useNavigate } from "react-router-dom";
import PlanetSystem from "../components/PlanetSystem";

export default function HeroSection() {
  const navigate = useNavigate();

  return (
<section className="relative h-screen flex flex-col justify-center items-center text-center text-white overflow-hidden bg-black">
  <PlanetSystem /> {/* <-- this adds your animated background */}
  <div className="relative z-10">
    <h1 className="text-5xl font-bold mb-6 text-blue-100 drop-shadow-[0_0_20px_#00bfff]">
      World Away: Hunting for Exoplanets with AI
    </h1>
    <p className="text-lg text-gray-300 mb-8">
      Discover missions like TESS, K2, and KOI.
    </p>
    <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-semibold shadow-lg transition">
      Get Started
    </button>
      </div>
    </section>
  );
}
