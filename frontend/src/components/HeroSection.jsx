import { useNavigate } from "react-router-dom";

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="h-screen flex flex-col justify-center items-center text-center bg-gradient-to-b from-black via-gray-900 to-black text-white">
      <h1 className="text-5xl font-bold mb-6">World Away: Hunting for Exoplanets with AI</h1>
      <p className="text-lg text-gray-300 mb-8">
        Discover missions like TESS, K2, and KOI.
      </p>
      <button
        onClick={() => navigate("/missions")}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-semibold shadow-lg transition"
      >
        Get Started
      </button>
    </section>
  );
}