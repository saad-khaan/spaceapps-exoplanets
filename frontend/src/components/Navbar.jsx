import React from "react";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="p-4 flex justify-center space-x-8 text-lg">
      <button onClick={() => navigate("/")} className="hover:text-blue-400">
        Home
      </button>
      <button onClick={() => navigate("/missions")} className="hover:text-blue-400">
        Missions
      </button>
      <button onClick={() => navigate("/upload")} className="hover:text-blue-400">
        Upload
      </button>
      <button onClick={() => navigate("/about")} className="hover:text-blue-400">
        About
      </button>
    </nav>
  );
}
