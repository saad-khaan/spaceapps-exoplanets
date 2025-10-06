// src/missions/config.js
export const MISSION_TO_MODEL = {
  KOI: "koi",
  K2: "k2",
  TESS: "tess",
};

export const API_BASE =
  import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";