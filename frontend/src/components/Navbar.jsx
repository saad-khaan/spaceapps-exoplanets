import { Link, useLocation } from "react-router-dom";
import nasaLogo from "../assets/nasa_logo.png";

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path
      ? "text-yellow-400 font-semibold border-b-2 border-yellow-400"
      : "text-white hover:text-yellow-300";

  return (
    <nav className="w-full fixed top-0 bg-transparent shadow-none backdrop-filter-none border-none text-white z-50 pointer-events-auto">
      <div className="w-full py-2 flex items-center justify-between">
        
        {/* === Left Side - NASA Logo === */}
        <Link
          to="/"
          className="flex items-center space-x-3 ml-4"
        >
          <img
            src={nasaLogo}
            alt="NASA Space Apps Logo"
            className="w-36 h-36 object-contain"
          />
        </Link>

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
        </div>
      </div>
    </nav>
  );
}
