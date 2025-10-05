import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

export default function StarBackground() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  if (!init) {
    return null; // avoid rendering before init
  }

  return (
    <Particles
      id="tsparticles"
      className="absolute inset-0 -z-10"
      options={{
        background: {
          color: { value: "#000000" },
        },
        fpsLimit: 60,
        fullScreen: { enable: false },
        detectRetina: true,

        particles: {
          number: { value: 180, density: { enable: true, area: 800 } },
          color: { value: "#ffffff" },
          shape: { type: "circle" },
          opacity: {
            value: 0.8,
            random: true,
            anim: { enable: true, speed: 0.5, opacity_min: 0.3, sync: false },
          },
          size: { value: { min: 0.5, max: 2 } },
          move: {
            enable: true,
            speed: 0.15,
            direction: "none",
            random: true,
            straight: false,
            outModes: { default: "out" },
          },
          twinkle: {
            particles: {
              enable: true,
              frequency: 0.05,
              opacity: 1,
            },
          },
        },

        /* 🌠 Shooting Stars */
        emitters: [
          {
            direction: "top-right",
            rate: {
              delay: 6,
              quantity: 1,
            },
            size: { width: 0, height: 0 },
            position: { x: 0, y: 100 },
            particles: {
              move: {
                direction: "top-right",
                speed: { min: 6, max: 9 },
                straight: true,
                outModes: { default: "destroy" },
              },
              size: { value: 2 },
              color: { value: "#ffffff" },
              opacity: { value: 1 },
              trail: {
                enable: true,
                length: 0.6,
                fillColor: "#000000",
              },
            },
          },
        ],
      }}
    />
  );
}
