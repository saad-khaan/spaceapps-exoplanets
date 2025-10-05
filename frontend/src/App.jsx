import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "./components/Navbar";
import HeroSection from "./pages/HeroSection.jsx";
import UploadSection from "./pages/UploadSection.jsx";
import MissionsPage from "./pages/MissionsPage.jsx";
import AboutPage from "./components/AboutPage.jsx";

function App() {
  return (
    <Router>
      <div className="min-h-screen text-white bg-transparent">
        <Navbar />
        <AnimatedRoutes />
      </div>
    </Router>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Home Page */}
        <Route
          path="/"
          element={
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <HeroSection />
            </motion.div>
          }
        />

        {/* Missions Page */}
        <Route
          path="/missions"
          element={
            <motion.div
              key="missions"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <MissionsPage />
            </motion.div>
          }
        />

        {/* ✅ Upload Page (Dynamic for each mission) */}
        <Route
          path="/upload/:missionName"
          element={
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <UploadSection />
            </motion.div>
          }
        />

        {/* About Page */}
        <Route
          path="/about"
          element={
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <AboutPage />
            </motion.div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export default App;
