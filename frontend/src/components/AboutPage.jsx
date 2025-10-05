import React from "react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white flex flex-col items-center justify-center px-6 py-12">
      {/* === Page Heading === */}
      <h1 className="text-5xl font-bold mb-12 text-center">Our Team</h1>
      <p className="max-w-2xl text-center text-gray-400 mb-16">
        We are a passionate group of space enthusiasts and developers working
        together on the NASA Space Apps Challenge to explore exoplanets and
        bring data to life through innovation and design.
      </p>

      {/* === Team Members Grid === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* ---- Saad Khan ---- */}
        <div className="flex flex-col items-center">
          <div className="w-48 h-48 border-4 border-blue-500 rounded-2xl shadow-[0_0_40px_#00bfff] flex items-center justify-center bg-gray-800">
            <span className="text-gray-500 italic">Photo</span>
          </div>
          <p className="mt-4 text-xl font-semibold">Saad Khan</p>
          <p className="text-gray-400 text-sm">Full-Stack Developer</p>
        </div>

        {/* ---- Muhammad Samad Mahar ---- */}
        <div className="flex flex-col items-center">
          <div className="w-48 h-48 border-4 border-blue-500 rounded-2xl shadow-[0_0_40px_#00bfff] flex items-center justify-center bg-gray-800">
            <span className="text-gray-500 italic">Photo</span>
          </div>
          <p className="mt-4 text-xl font-semibold">Muhammad Samad Mahar</p>
          <p className="text-gray-400 text-sm">UI/UX & Data Visualization</p>
        </div>

        {/* ---- Abdullah Shah ---- */}
        <div className="flex flex-col items-center">
          <div className="w-48 h-48 border-4 border-blue-500 rounded-2xl shadow-[0_0_40px_#00bfff] flex items-center justify-center bg-gray-800">
            <span className="text-gray-500 italic">Photo</span>
          </div>
          <p className="mt-4 text-xl font-semibold">Abdullah Shah</p>
          <p className="text-gray-400 text-sm">Full-Stack Developer</p>
        </div>

        {/* ---- Taimoor Shehzad ---- */}
        <div className="flex flex-col items-center">
          <div className="w-48 h-48 border-4 border-blue-500 rounded-2xl shadow-[0_0_40px_#00bfff] flex items-center justify-center bg-gray-800">
            <span className="text-gray-500 italic">Photo</span>
          </div>
          <p className="mt-4 text-xl font-semibold">Taimoor Shehzad</p>
          <p className="text-gray-400 text-sm">ML & Research Engineer</p>
        </div>
      </div>
    </div>
  );
}

