// import { Link, useLocation } from "react-router-dom";
// import nasaLogo from "../assets/nasa_logo.png";

// export default function Navbar() {
//   const location = useLocation();

//   const isActive = (path) =>
//     location.pathname === path
//       ? "text-[#E6EF4C] font-semibold border-b-2 border-[#E6EF4C] drop-shadow-[0_0_10px_#E6EF4C]"
//       : "text-white hover:text-[#E6EF4C] hover:drop-shadow-[0_0_6px_#E6EF4C]";

//   return (
//     <nav className="w-full fixed top-0 bg-transparent shadow-none border-none text-white z-50 pointer-events-auto">
//       <div className="w-full py-3 flex items-center justify-between">
        
//         {/* === Left Side - NASA Logo + Title === */}
//         <div className="flex items-center space-x-4 ml-4">
//           <Link to="/" className="flex items-center space-x-3">
//             <img
//               src={nasaLogo}
//               alt="NASA Space Apps Logo"
//               className="w-36 h-36 object-contain drop-shadow-[0_0_12px_#E6EF4C]"
//             />
//           </Link>

//           {/* Title beside the logo */}
//           <h1 className="text-2xl font-bold text-[#E6EF4C] drop-shadow-[0_0_10px_#E6EF4C] tracking-wide">
//             A World Away: Hunting for Exoplanets with AI
//           </h1>
//         </div>

//         {/* === Center Nav Links === */}
//         <div className="flex space-x-10 text-lg font-medium mr-12">
//           <Link to="/" className={isActive("/")}>
//             Home
//           </Link>
//           <Link to="/missions" className={isActive("/missions")}>
//             Missions
//           </Link>
//           <Link to="/about" className={isActive("/about")}>
//             About Us
//           </Link>
//           <a
//             href="https://www.spaceappschallenge.org/2025/challenges/a-world-away-hunting-for-exoplanets-with-ai/"
//             target="_blank"
//             rel="noopener noreferrer"
//             className="text-white hover:text-[#E6EF4C] hover:drop-shadow-[0_0_6px_#E6EF4C]"
//           >
//             Learn More
//           </a>
//         </div>
//       </div>
//     </nav>
//   );
// }

import { Link, useLocation } from "react-router-dom";
import nasaLogo from "../assets/nasa_logo.png";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const location = useLocation();
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // === Hide Navbar on scroll down, show on scroll up ===
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // scrolling down
        setVisible(false);
      } else {
        // scrolling up
        setVisible(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const isActive = (path) =>
    location.pathname === path
      ? "text-[#E6EF4C] font-semibold border-b-2 border-[#E6EF4C] drop-shadow-[0_0_10px_#E6EF4C]"
      : "text-white hover:text-[#E6EF4C] hover:drop-shadow-[0_0_6px_#E6EF4C]";

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          className="w-full fixed top-0 bg-transparent shadow-none border-none text-white z-50 pointer-events-auto"
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="w-full py-3 flex items-center justify-between">
            {/* === Left Side - NASA Logo + Title === */}
            <div className="flex items-center space-x-4 ml-4">
              <Link to="/" className="flex items-center space-x-3">
                <img
                  src={nasaLogo}
                  alt="NASA Space Apps Logo"
                  className="w-36 h-36 object-contain drop-shadow-[0_0_12px_#E6EF4C]"
                />
              </Link>

              {/* Title beside the logo */}
              <h1 className="text-2xl font-bold text-[#E6EF4C] drop-shadow-[0_0_10px_#E6EF4C] tracking-wide">
                A World Away: Hunting for Exoplanets with AI
              </h1>
            </div>

            {/* === Center Nav Links === */}
            <div className="flex space-x-10 text-lg font-medium mr-12">
              <Link to="/" className={isActive("/")}>
                Home
              </Link>
              <Link to="/missions" className={isActive("/missions")}>
                Missions
              </Link>
              <Link to="/about" className={isActive("/about")}>
                About Us
              </Link>
              <a
                href="https://www.spaceappschallenge.org/2025/challenges/a-world-away-hunting-for-exoplanets-with-ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-[#E6EF4C] hover:drop-shadow-[0_0_6px_#E6EF4C]"
              >
                Learn More
              </a>
            </div>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}