import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SolarSystemBackground from "../components/SolarSystemBackground";
import ShiningStarsBackground from "../components/ShiningStarsBackground";

export default function MissionsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black text-white px-6 pt-24">

      {/* === NASA Background === */}
      <div
        className="absolute inset-0 bg-[url('https://images-assets.nasa.gov/image/PIA12235/PIA12235~orig.jpg')] bg-cover bg-center bg-fixed opacity-30"
      ></div>

      {/* === Shining Stars Background === */}
      <div className="absolute inset-0 z-[2] pointer-events-none">
        <ShiningStarsBackground />
      </div>

      {/* === Overlay gradient for smooth fade === */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#000814]/70 via-[#000814]/90 to-black/95 z-[1]"></div>

      {/* === Transparent Navbar === */}
      <nav className="fixed top-0 w-full z-[50] bg-transparent backdrop-filter-none shadow-none border-none pointer-events-auto">
        {/* your existing navbar content here */}
      </nav>

      {/* === Revolving Solar System Background === */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        <SolarSystemBackground />
      </div>

      {/* === Main Page Content === */}
      <div className="relative z-10 flex flex-col items-center justify-center">

        {/* === Header Above Earth (moved up) === */}
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mt-[-60px] text-3xl md:text-4xl font-semibold text-blue-300 mb-20 text-center drop-shadow-[0_0_10px_#00bfff]"
        >
          Select a NASA mission to test its exoplanet dataset
        </motion.p>

        {/* === Rotating Earth (bigger size) === */}
        <div className="relative flex items-center justify-center mt-12">
          <motion.img
            src="https://upload.wikimedia.org/wikipedia/commons/9/97/The_Earth_seen_from_Apollo_17.jpg"
            alt="Planet Earth"
            className="w-[520px] h-[520px] md:w-[600px] md:h-[600px] rounded-full shadow-[0_0_90px_#00bfff] border-4 border-blue-500"
            animate={{ rotate: 360 }}
            transition={{
              repeat: Infinity,
              duration: 50,
              ease: "linear",
            }}
          />

          {/* === TESS (top) === */}
          <div
            className="absolute flex flex-col items-center"
            style={{
              top: "-60px",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <motion.div
              className="relative flex flex-col items-center"
              initial="rest"
              whileHover="hovered"
              animate="rest"
            >
              <motion.button
                onClick={() => navigate("/upload/tess")}
                className="bg-blue-600 hover:bg-blue-700 px-7 py-3 rounded-full text-lg font-semibold shadow-[0_0_25px_#00bfff] transition-transform hover:scale-110"
              >
                TESS
              </motion.button>

              <motion.div
                variants={{
                  rest: { opacity: 0, x: 10, scale: 0.98 },
                  hovered: { opacity: 1, x: 20, scale: 1 },
                }}
                transition={{ duration: 0.25 }}
                className="absolute left-full ml-4 bg-gray-900/90 border border-blue-500 text-sm text-blue-200 px-4 py-2 rounded-lg w-64 text-left shadow-[0_0_25px_#00bfff] backdrop-blur-sm pointer-events-none"
              >
                <strong>TESS (Transiting Exoplanet Survey Satellite):</strong><br />
                Observes nearby stars to detect exoplanets by measuring small dips in brightness.
              </motion.div>
            </motion.div>
          </div>

          {/* === K2 (bottom-left) === */}
          <div
            className="absolute flex flex-col items-center"
            style={{
              bottom: "-20px",
              left: "calc(35% - 130px)",
            }}
          >
            <motion.div
              className="relative flex flex-col items-center"
              initial="rest"
              whileHover="hovered"
              animate="rest"
            >
              <motion.button
                onClick={() => navigate("/upload/k2")}
                className="bg-purple-600 hover:bg-purple-700 px-7 py-3 rounded-full text-lg font-semibold shadow-[0_0_25px_#b266ff] transition-transform hover:scale-110"
              >
                K2
              </motion.button>

              <motion.div
                variants={{
                  rest: { opacity: 0, x: -10, scale: 0.98 },
                  hovered: { opacity: 1, x: -20, scale: 1 },
                }}
                transition={{ duration: 0.25 }}
                className="absolute right-full mr-4 bg-gray-900/90 border border-purple-500 text-sm text-purple-200 px-4 py-2 rounded-lg w-64 text-left shadow-[0_0_25px_#b266ff] backdrop-blur-sm pointer-events-none"
              >
                <strong>K2 Mission:</strong><br />
                A reoriented Kepler mission studying exoplanets, galaxies, and stellar activity.
              </motion.div>
            </motion.div>
          </div>

          {/* === KOI (bottom-right) === */}
          <div
            className="absolute flex flex-col items-center"
            style={{
              bottom: "-20px",
              right: "calc(35% - 130px)",
            }}
          >
            <motion.div
              className="relative flex flex-col items-center"
              initial="rest"
              whileHover="hovered"
              animate="rest"
            >
              <motion.button
                onClick={() => navigate("/upload/koi")}
                className="bg-pink-600 hover:bg-pink-700 px-7 py-3 rounded-full text-lg font-semibold shadow-[0_0_25px_#ff3fa4] transition-transform hover:scale-110"
              >
                KOI
              </motion.button>

              <motion.div
                variants={{
                  rest: { opacity: 0, x: 10, scale: 0.98 },
                  hovered: { opacity: 1, x: 20, scale: 1 },
                }}
                transition={{ duration: 0.25 }}
                className="absolute left-full ml-4 bg-gray-900/90 border border-pink-500 text-sm text-pink-200 px-4 py-2 rounded-lg w-64 text-left shadow-[0_0_25px_#ff3fa4] backdrop-blur-sm pointer-events-none"
              >
                <strong>KOI (Kepler Object of Interest):</strong><br />
                Catalogues potential exoplanets detected by Kepler via light-curve variations.
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
