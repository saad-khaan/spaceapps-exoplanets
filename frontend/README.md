# ExoVision Frontend  
### Developed by Team Stellar Detectives – NASA Space Apps Challenge 2025  

---

## Overview

The **ExoVision frontend** is an interactive web interface that allows users to explore and analyze exoplanet datasets using AI models.  
Built with **React, Vite, Tailwind CSS**, and **Framer Motion**, it provides an immersive and visually rich experience inspired by NASA’s missions.

Users can:
- Select a NASA mission (TESS, K2, or KOI)
- Upload CSV datasets
- Analyze results from the backend AI models
- View interactive metrics, confusion matrices, and performance insights

The design includes space-themed motion elements, shining star effects, and a rotating Earth centerpiece to emphasize the astronomical nature of the challenge.

---

## Key Features

- Interactive mission selection with animated transitions  
- CSV upload validation and progress feedback  
- AI-powered metric visualization (accuracy, F1, recall, etc.)  
- Confusion matrix heatmaps and prediction distributions  
- Insight recommendations for model improvement  
- Responsive, GPU-accelerated design  
- Dynamic backgrounds (solar system, stars, NASA imagery)

---

## Technology Stack

| Category | Technology |
|-----------|-------------|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| API Calls | Axios |
| Environment | Node.js (v18 or later) |

---

## Installation and Setup

Follow these steps to run the frontend locally.

### 1. Navigate to the frontend folder
```bash
cd frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run the development server
```bash
npm run dev
```

By default, Vite will start the development server at:
```
http://localhost:5173
```

Ensure your backend FastAPI server is running at:
```
http://localhost:8000
```

---

## Build for Production

To create a production-ready build:
```bash
npm run build
```

To preview the build locally:
```bash
npm run preview
```

---

## Environment Variables

You can configure the backend API URL by creating a `.env` file in the `frontend` directory.

Example:
```
VITE_API_BASE_URL=http://localhost:8000
```

This allows the frontend to connect to your backend API endpoints during development or deployment.

---

## File Highlights

| File | Description |
|------|--------------|
| `src/pages/MissionsPage.jsx` | Main mission selection page with 3D animations and navigation |
| `src/pages/UploadSection.jsx` | Core page for dataset upload and model evaluation |
| `src/components/SolarSystemBackground.jsx` | Animated rotating planet and orbit visuals |
| `src/components/ShiningStarsBackground.jsx` | Subtle animated starfield background |
| `src/components/Navbar.jsx` | Responsive, glowing top navigation bar |
| `src/lib/api.js` | API handler for communication with the FastAPI backend |

---

## Connecting to Backend

- The frontend communicates with the FastAPI backend over HTTP.
- Backend endpoints include `/evaluate/{model}`, `/predict/{model}`, and `/model_card/{model}`.
- CORS should be enabled in the backend for frontend requests to work properly.

Example frontend call (inside `api.js`):
```js
await axios.post(`${VITE_API_BASE_URL}/evaluate/tess`, formData);
```

---

## Troubleshooting

**Issue:** `Network Error` or `CORS policy`  
**Solution:** Enable CORS in FastAPI or update the API base URL in `.env`.

**Issue:** Blank screen or missing assets  
**Solution:** Run `npm run dev` from the correct directory (`/frontend`) and ensure dependencies are installed.

**Issue:** Slow animations  
**Solution:** Reduce Framer Motion durations in `MissionsPage.jsx` or disable certain effects for low-spec devices.

---

## Future Enhancements

- Add login and user profiles for saved analyses  
- Integrate real NASA Exoplanet Archive APIs  
- Support 3D interactive orbit visualizations  
- Provide export options (PDF reports, CSV results)

---

## Credits

**Team Stellar Detectives**  
NASA Space Apps Challenge 2025  
Project: **ExoVision – A World Away: Hunting for Exoplanets with AI**

---

## License

This frontend is part of the **ExoVision** project and is released for educational and non-commercial research use under the NASA Space Apps 2025 terms.
