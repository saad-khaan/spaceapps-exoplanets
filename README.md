# ExoVision  
### Team Stellar Detectives – NASA Space Apps Challenge 2025  

---

## Overview

**ExoVision** is an interactive web platform developed for the **NASA Space Apps Challenge 2025** by **Team Stellar Detectives**.  
The project supports the challenge theme *“A World Away: Hunting for Exoplanets with AI”*, aiming to make exoplanet discovery accessible, explainable, and visually engaging through the integration of machine learning and interactive visualization.

Our application enables users to upload exoplanet datasets from major NASA missions—**TESS**, **K2**, and **KOI**—and analyze them using pre-trained AI models. The interface transforms raw CSV inputs into detailed, human-readable performance dashboards with key metrics, confusion matrices, and interpretive insights.

---

## The Problem

The process of identifying and classifying exoplanets from telescope data involves analyzing subtle variations in starlight intensity. This requires complex machine learning pipelines and domain expertise, which can be a barrier to public exploration and interdisciplinary research.

Existing tools are often technical, lacking interactivity and interpretability. Researchers and enthusiasts need an approachable platform that both demonstrates the analytical power of AI and explains its outputs in a meaningful, visual manner.

---

## The Solution: ExoVision

ExoVision bridges the gap between scientific complexity and intuitive understanding.  
It provides a unified environment for users to:

- Upload light-curve or labeled exoplanet datasets in CSV format.  
- Automatically evaluate or predict outcomes using mission-specific AI models.  
- Visualize accuracy, F1 score, recall, and class-level performance in real time.  
- Access generated insights highlighting biases, confusions, and improvement areas.  
- Explore mission-specific context through interactive UI elements and model cards.

The platform’s design emphasizes transparency, usability, and engagement—allowing anyone from students to data scientists to interact with NASA’s exoplanet data intelligently.

---

## Key Features

- **Mission-based Interface:** Select between TESS, K2, and KOI missions using a dynamic orbital layout.  
- **AI-Powered Analysis:** Instantly evaluate datasets or generate predictions using trained models.  
- **Interactive Metrics:** Explore confusion matrices, class-level reports, and performance deltas visually.  
- **Insight Generation:** Automated text summaries interpret metrics and suggest dataset improvements.  
- **Model Transparency:** View model cards summarizing training details and limitations.  
- **Immersive Design:** Layered space-themed visuals, solar system animations, and responsive transitions.  

---

## Technical Overview

**Frontend:**  
- React (Vite) for component-based UI development  
- Tailwind CSS for modern, adaptive styling  
- Framer Motion for smooth animations and transitions  

**Backend:**  
- FastAPI (Python) for fast, asynchronous API handling  
- scikit-learn, NumPy, and Pandas for model evaluation and preprocessing  
- Pre-trained mission-specific models (TESS, K2, KOI) for inference  
- Uvicorn for local API serving  

**Integration:**  
The frontend communicates with the FastAPI backend to upload files, trigger evaluations, and retrieve performance reports or predictions. Results are processed and displayed instantly within the browser, maintaining an entirely interactive workflow.

---

## How to Use

1. Select a NASA mission from the interactive home interface.  
2. Upload a `.csv` dataset containing light-curve or classification data.  
3. Click **Analyze** to run the model.  
4. Review metrics, confusion matrices, and AI-generated insights.  
5. Optionally view the model card for detailed background information.  

---

## Scientific Relevance

ExoVision contributes to the democratization of exoplanet research by translating complex AI outputs into interpretable visual insights. It demonstrates how data-driven astronomy can be communicated effectively through design and technology, aligning with NASA’s open science and citizen engagement goals.

---

## Team Stellar Detectives

- Saad Khan  
- Taimoor Shahzad
- Abdullah Shah
- Muhammad Samad Mahar

Team Stellar Detectives combines expertise in software engineering, data science, and design to create interactive, data-driven tools for space exploration.

---

## Acknowledgments

- NASA Exoplanet Archive  
- NASA Space Apps Challenge  
- Open-source libraries and frameworks powering this project  