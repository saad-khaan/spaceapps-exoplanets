import { useState } from "react";

export default function UploadSection() {
  const [file, setFile] = useState(null);
  const [planetRadius, setPlanetRadius] = useState("");
  const [orbitalDays, setOrbitalDays] = useState("");
  const [transitPeriod, setTransitPeriod] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleAnalyze = () => {
    console.log("File:", file);
    console.log("Planet Radius:", planetRadius);
    console.log("Orbital Days:", orbitalDays);
    console.log("Transit Period:", transitPeriod);
    alert("Data submitted successfully 🚀");
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
      {/* === Page Title === */}
      <h1 className="text-4xl font-bold text-blue-400 mb-2 drop-shadow-[0_0_10px_#00bfff]">
        Upload Dataset
      </h1>
      <p className="text-gray-300 mb-10 text-center max-w-md">
        Upload your CSV dataset or manually input values below to classify new exoplanet data.
      </p>

      {/* === Input Section === */}
      <div className="bg-gray-900/40 border border-gray-700 rounded-xl p-8 w-full max-w-md shadow-[0_0_25px_#00bfff]/30">
        {/* Header */}
        <h2 className="text-2xl font-semibold text-blue-300 mb-6 text-center">
          Input Values
        </h2>

        {/* Input Fields */}
        <div className="flex flex-col space-y-4 mb-8">
          {/* Planet Radius */}
          <div className="flex flex-col">
            <label className="text-gray-300 mb-1">Planet Radius (in Earth radii)</label>
            <input
              type="number"
              step="any"
              value={planetRadius}
              onChange={(e) => setPlanetRadius(e.target.value)}
              placeholder="e.g., 1.3"
              className="px-4 py-2 rounded-md bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100"
            />
          </div>

          {/* Orbital Days */}
          <div className="flex flex-col">
            <label className="text-gray-300 mb-1">Orbital Days</label>
            <input
              type="number"
              step="any"
              value={orbitalDays}
              onChange={(e) => setOrbitalDays(e.target.value)}
              placeholder="e.g., 365.25"
              className="px-4 py-2 rounded-md bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100"
            />
          </div>

          {/* Transit Period */}
          <div className="flex flex-col">
            <label className="text-gray-300 mb-1">Transit Period (in hours)</label>
            <input
              type="number"
              step="any"
              value={transitPeriod}
              onChange={(e) => setTransitPeriod(e.target.value)}
              placeholder="e.g., 12.4"
              className="px-4 py-2 rounded-md bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100"
            />
          </div>
        </div>

        {/* Divider Line */}
        <div className="flex items-center justify-center my-6">
          <div className="w-full border-t-2 border-blue-500 opacity-60"></div>
        </div>

        {/* Upload Section */}
        <h2 className="text-2xl font-semibold text-blue-300 mb-4 text-center">
          Upload Document
        </h2>

        <div className="flex flex-col items-center mb-8">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="border-2 border-blue-400 px-4 py-2 rounded-md bg-gray-800 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Analyze Button */}
        <div className="flex justify-center">
          <button
            onClick={handleAnalyze}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-semibold shadow-lg hover:shadow-[0_0_20px_#00bfff] transition-all"
          >
            Analyze
          </button>
        </div>
      </div>
    </div>
  );
}
