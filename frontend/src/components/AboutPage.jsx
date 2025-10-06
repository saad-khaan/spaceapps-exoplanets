import abdullahImg from "../assets/Abdullah.PNG";
import saadImg from "../assets/saad.png";
import taimoorImg from "../assets/taimoor.jpeg";
import samadImg from "../assets/Samad.JPG";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white flex flex-col items-center justify-start px-6 pt-36 md:pt-40 pb-16">
      {/* ↑ Added top padding so content clears navbar dynamically */}

      {/* === Page Heading === */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 md:mb-12 text-center text-[#E6EF4C] drop-shadow-[0_0_25px_#E6EF4C] leading-tight">
        Meet the Stellar Detectives Team
      </h1>

      {/* === Intro Paragraph === */}
      <p className="max-w-2xl text-center text-gray-300 mb-10 md:mb-16 text-sm sm:text-base">
        We are a passionate group of space enthusiasts and developers working
        together on the NASA Space Apps Challenge to explore exoplanets and
        bring data to life through innovation and design.
      </p>

      {/* === Team Members Grid === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-16 place-items-center">
        
        {/* ---- Saad Khan ---- */}
<div className="flex flex-col items-center">
  <div className="w-44 sm:w-48 h-44 sm:h-48 border-4 border-[#E6EF4C] rounded-2xl overflow-hidden shadow-[0_0_40px_#E6EF4C] bg-gray-900">
  <img src={saadImg} alt="Saad Khan" className="object-cover w-full h-full object-center scale-[1.05]" />
  </div>
  <p className="mt-4 text-lg sm:text-xl font-semibold text-white">Saad Khan</p>
  <p className="text-sm sm:text-base text-white">Full-Stack Developer</p>
  <p className="text-sm sm:text-base text-white">3rd Year SENG</p>
</div>


        {/* ---- Muhammad Samad Mahar ---- */}
        <div className="flex flex-col items-center">
          <div className="w-44 sm:w-48 h-44 sm:h-48 border-4 border-[#E6EF4C] rounded-2xl overflow-hidden shadow-[0_0_40px_#E6EF4C] bg-black">
          <img src={samadImg} alt="Muhammad Samad Mahar" className="object-cover object-[55%_45%] w-full h-full scale-[1.15]" />
          </div>
          <p className="mt-4 text-lg sm:text-xl font-semibold text-white">Muhammad Samad Mahar</p>
          <p className="text-sm sm:text-base text-white">UI/UX & Data Visualization</p>
          <p className="text-sm sm:text-base text-white">3rd Year PHY & CS</p>
        </div>

        {/* ---- Abdullah Shah ---- */}
        <div className="flex flex-col items-center">
          <div className="w-44 sm:w-48 h-44 sm:h-48 border-4 border-[#E6EF4C] rounded-2xl overflow-hidden shadow-[0_0_40px_#E6EF4C] bg-black">
            <img src={abdullahImg} alt="Abdullah Shah" className="object-cover object-top w-full h-full scale-[1.15]" />
          </div>
          <p className="mt-4 text-lg sm:text-xl font-semibold text-white">Abdullah Shah</p>
          <p className="text-sm sm:text-base text-white">Full-Stack Developer</p>
          <p className="text-sm sm:text-base text-white">3rd Year CS</p>
        </div>

        {/* ---- Taimoor Shahzad ---- */}
        <div className="flex flex-col items-center">
          <div className="w-44 sm:w-48 h-44 sm:h-48 border-4 border-[#E6EF4C] rounded-2xl overflow-hidden shadow-[0_0_40px_#E6EF4C] bg-black">
            <img src={taimoorImg} alt="Taimoor Shahzad" className="object-cover object-center w-full h-full" />
          </div>
          <p className="mt-4 text-lg sm:text-xl font-semibold text-white">Taimoor Shahzad</p>
          <p className="text-sm sm:text-base text-white">ML Research & Development</p>
          <p className="text-sm sm:text-base text-white">MEng ECE</p>
        </div>

      </div>
    </div>
  );
}