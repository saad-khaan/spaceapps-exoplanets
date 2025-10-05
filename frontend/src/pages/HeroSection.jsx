import { useNavigate } from "react-router-dom";
import PlanetSystem from "../components/PlanetSystem";

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative h-screen flex flex-col justify-center items-center text-center text-white overflow-hidden bg-black">
      <PlanetSystem /> {/* <-- animated background */}
      <div className="relative z-10">
        {/* === Title Wrapper so tagline can align right === */}
        <div className="inline-block text-left">
          <h1 className="text-5xl md:text-6xl font-extrabold text-blue-300 drop-shadow-[0_0_25px_#00bfff] mb-0 leading-tight">
            ExoVision
          </h1>

          {/* === Trademark line aligned to end of the word === */}
          <p className="text-[#E6EF4C] text-lg md:text-xl font-semibold italic tracking-wide drop-shadow-[0_0_8px_#E6EF4C] text-right">
            by Stellar Detectives<span className="align-super text-sm">™️</span>
          </p>
        </div>

        {/* === Subtitle === */}
        <p className="text-lg text-gray-300 mt-6 mb-8">
          Discover missions like TESS, K2, and KOI.
        </p>

        {/* === Button === */}
        <button
          onClick={() => navigate("/missions")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-semibold shadow-lg hover:shadow-[0_0_20px_#00bfff] transition-all"
        >
          Get Started
        </button>
      </div>
    </section>
  );
}