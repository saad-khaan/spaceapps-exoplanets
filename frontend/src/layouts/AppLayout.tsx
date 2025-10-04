import { NavLink, Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="min-h-screen">
      <header className="bg-nasaBlue">
        <nav className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between text-white">
          <span className="font-semibold tracking-wide">Exoplanet AI</span>
          <div className="flex items-center gap-6">
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `hover:opacity-90 ${isActive ? "underline underline-offset-4" : ""}`
              }
            >
              About Us
            </NavLink>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `hover:opacity-90 ${isActive ? "underline underline-offset-4" : ""}`
              }
            >
              Dashboard
            </NavLink>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 text-white">
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-white/70">
          Built for NASA Space Apps • Data (planned): NASA Exoplanet Archive &amp; MAST
        </div>
      </footer>
    </div>
  );
}