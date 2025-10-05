import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

export default function ShiningStarsBackground() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  if (!init) return null;

  return (
    <Particles
      id="tsparticles-shining"
      className="absolute inset-0 -z-10"
      options={{
        background: {
          color: { value: "#000000" },
        },
        fpsLimit: 60,
        detectRetina: true,
        fullScreen: { enable: false },

        particles: {
          number: {
            value: 350, // more stars
            density: { enable: true, area: 800 },
          },
          color: { value: "#ffffff" },
          shape: { type: "circle" },
          opacity: {
            value: 1,
            random: true,
            animation: {
              enable: true,
              speed: 2.5,
              minimumValue: 0.3,
              sync: false,
            },
          },
          size: {
            value: { min: 1, max: 3.5 },
            animation: {
              enable: true,
              speed: 3,
              minimumValue: 0.5,
              sync: false,
            },
          },
          twinkle: {
            particles: {
              enable: true,
              frequency: 0.1, // high frequency = more twinkling
              opacity: 1,
            },
          },
          move: {
            enable: true,
            speed: 0.2,
            direction: "none",
            random: true,
            straight: false,
            outModes: { default: "out" },
          },
        },

        /* 🌠 Shooting Stars */
        emitters: [
          {
            direction: "top-right",
            rate: {
              delay: 3, // more frequent
              quantity: 1,
            },
            size: { width: 0, height: 0 },
            position: { x: 0, y: 100 },
            particles: {
              move: {
                direction: "top-right",
                speed: { min: 12, max: 16 },
                straight: true,
                outModes: { default: "destroy" },
              },
              size: { value: { min: 1, max: 2 } },
              color: { value: "#ffffff" },
              opacity: { value: 1 },
              trail: {
                enable: true,
                length: 0.7,
                fillColor: "#000000",
              },
              life: {
                duration: { sync: true, value: 1 },
                count: 1,
              },
            },
          },
          {
            direction: "top-left",
            rate: { delay: 4.5, quantity: 1 },
            size: { width: 0, height: 0 },
            position: { x: 100, y: 100 },
            particles: {
              move: {
                direction: "top-left",
                speed: { min: 10, max: 14 },
                straight: true,
                outModes: { default: "destroy" },
              },
              size: { value: { min: 1, max: 2 } },
              color: { value: "#aafaff" },
              opacity: { value: 1 },
              trail: {
                enable: true,
                length: 0.7,
                fillColor: "#000000",
              },
              life: {
                duration: { sync: true, value: 1 },
                count: 1,
              },
            },
          },
        ],
      }}
    />
  );
}
