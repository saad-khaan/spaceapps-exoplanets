import { useParams } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function UploadSection() {
  const { missionName } = useParams();
  const mission = missionName?.toUpperCase();

  const [file, setFile] = useState(null);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false); // ✅ state to trigger shake animation

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(false);
  };

  const handleAnalyze = () => {
    if (!file) {
      setError(true);
      setShake(true);

      // reset the shake after animation completes
      setTimeout(() => setShake(false), 500);
      return;
    }

    console.log(`${mission} File:`, file);
    alert(`${mission} file submitted successfully`);
  };

  return (
    <div
      className="
        min-h-screen 
        flex flex-col items-center justify-start
        bg-gradient-to-b from-black via-gray-900 to-black 
        text-white px-6 
        pt-44 pb-16
      "
    >
      {/* === Dynamic Header === */}
      <h1 className="text-4xl font-bold text-blue-400 mb-2 drop-shadow-[0_0_10px_#00bfff]">
        Upload Datasets for {mission}
      </h1>

      <p className="text-gray-300 mb-10 text-center max-w-md">
        Upload your CSV dataset related to the {mission} mission.
      </p>

      {/* Divider */}
      <div className="flex items-center justify-center my-6 w-full max-w-xl">
        <div className="w-full border-t-2 border-blue-500 opacity-60"></div>
      </div>

      {/* Upload Section with Shake */}
      <motion.div
        className="flex flex-col items-center mb-6"
        animate={
          shake
            ? {
                x: [-10, 10, -10, 10, 0], // shake motion
              }
            : {}
        }
        transition={{ duration: 0.4 }}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className={`border-2 px-4 py-2 rounded-md bg-gray-800 text-sm text-gray-200 focus:outline-none transition-all
            ${
              error
                ? "border-red-500 focus:ring-2 focus:ring-red-500"
                : "border-blue-400 focus:ring-2 focus:ring-blue-500"
            }`}
        />

        <AnimatePresence>
          {error && (
            <motion.p
              className="text-red-500 text-sm mt-2 font-medium"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              Error: Input a file
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Analyze Button */}
      <div className="flex justify-center">
        <button
          onClick={handleAnalyze}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md font-semibold shadow-lg hover:shadow-[0_0_20px_#00bfff] transition-all"
        >
          Analyze
        </button>
      </div>
    </div>
  );
}
