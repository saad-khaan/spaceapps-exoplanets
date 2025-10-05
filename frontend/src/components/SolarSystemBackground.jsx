import { motion } from "framer-motion";

export default function SolarSystemBackground() {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">

      {/* === Orbit 1 === */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full border border-blue-400/20"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
      >
        <div className="absolute top-0 left-1/2 w-5 h-5 bg-blue-400 rounded-full blur-sm shadow-[0_0_20px_#00bfff]" />
      </motion.div>

      {/* === Orbit 2 === */}
      <motion.div
        className="absolute w-[700px] h-[700px] rounded-full border border-pink-400/15"
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 60, ease: "linear" }}
      >
        <div className="absolute top-0 left-1/2 w-6 h-6 bg-pink-400 rounded-full blur-sm shadow-[0_0_20px_#ff4dcf]" />
      </motion.div>

      {/* === Orbit 3 === */}
      <motion.div
        className="absolute w-[900px] h-[900px] rounded-full border border-green-400/10"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 90, ease: "linear" }}
      >
        <div className="absolute top-0 left-1/2 w-4 h-4 bg-green-400 rounded-full blur-sm shadow-[0_0_20px_#00ff7f]" />
      </motion.div>

      {/* === Faint stars overlay (static texture) === */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#000010_10%,#000)] opacity-70"></div>
    </div>
  );
}