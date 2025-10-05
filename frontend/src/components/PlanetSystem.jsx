import { motion } from "framer-motion";
import earth from "../assets/earth.jpg";
import mars from "../assets/mars.jpg.webp";
import uranus from "../assets/uranus.jpeg";

export default function PlanetSystem() {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {/* === Deep Space Gradient Background === */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#060014] via-[#0a002b] to-[#000014] opacity-95"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#000010_0%,_#000_100%)] mix-blend-overlay"></div>

      {/* === 🌈 MOVING AURORA RIBBON === */}
      <motion.div
        className="absolute inset-0 bg-[linear-gradient(120deg,_rgba(0,255,255,0.25)_0%,_rgba(255,0,255,0.2)_50%,_transparent_100%)] blur-3xl mix-blend-screen"
        animate={{ x: ["-10%", "10%", "-10%"] }}
        transition={{ repeat: Infinity, duration: 60, ease: "easeInOut" }}
      />

      {/* === 🌌 TWINKLING STARS === */}
      {[...Array(120)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute rounded-full"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 2 + 1}px`,
            height: `${Math.random() * 2 + 1}px`,
            backgroundColor: "white",
            opacity: Math.random() * 0.8 + 0.2,
            boxShadow: "0 0 6px rgba(255,255,255,0.8)",
          }}
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: Math.random() * 4 + 2,
            repeat: Infinity,
            delay: Math.random() * 4,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* === Orbit 1: Earth === */}
      <div className="absolute w-[500px] h-[500px] rounded-full border border-blue-400/30 animate-spin-slow shadow-[0_0_30px_10px_rgba(0,191,255,0.2)]">
        <img
          src={earth}
          alt="Earth"
          className="absolute w-20 h-20 rounded-full object-cover shadow-[0_0_80px_#00bfff] brightness-125"
          style={{
            top: "50%",
            left: "100%",
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>

      {/* === Orbit 2: Mars === */}
      <div className="absolute w-[700px] h-[700px] rounded-full border border-red-500/25 animate-spin-reverse shadow-[0_0_40px_10px_rgba(255,69,0,0.15)]">
        <img
          src={mars}
          alt="Mars"
          className="absolute w-16 h-16 rounded-full object-cover shadow-[0_0_70px_#ff4500] brightness-125"
          style={{
            top: "50%",
            left: "100%",
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>

      {/* === Orbit 3: Uranus === */}
      <div className="absolute w-[900px] h-[900px] rounded-full border border-cyan-400/30 animate-spin-slower shadow-[0_0_60px_15px_rgba(0,255,255,0.2)]">
        <img
          src={uranus}
          alt="Uranus"
          className="absolute w-24 h-24 rounded-full object-cover shadow-[0_0_100px_#00ffff] brightness-150 contrast-125"
          style={{
            top: "50%",
            left: "100%",
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>
    </div>
  );
}