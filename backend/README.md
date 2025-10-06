# ExoVision Backend

The backend of **ExoVision**, developed by **Stellar Detectives**, powers the machine learning inference and evaluation logic behind our NASA Space Apps Challenge project — **A World Away: Hunting for Exoplanets with AI**.

---

## Overview

The backend is built using **FastAPI**, a modern and high-performance Python web framework.  
It serves endpoints for uploading datasets, running machine learning models (TESS, KOI, and K2), and returning prediction and evaluation metrics.

---

## Features

- FastAPI-based RESTful API.
- CSV upload endpoint for inference and evaluation.
- Supports multiple trained models (TESS, KOI, K2).
- Generates classification reports, confusion matrices, and insights.
- Returns metrics such as accuracy, F1-score, and balanced accuracy.
- Easily integrable with the React frontend.

---

## Requirements

- Python 3.10 or higher
- pip (Python package manager)
- Virtual environment (recommended)

---

## Setup Instructions

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/exovision.git
   cd exovision/backend
   ```

2. **Create and activate a virtual environment**

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # On macOS/Linux
   # or
   .venv\Scripts\activate   # On Windows
   ```

3. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

4. **Run the backend server**

   ```bash
   uvicorn app.main_multi:app --host 0.0.0.0 --port 8000 --reload
   ```

   The backend will now be running on:  
   👉 **http://localhost:8000**

---

## Folder Structure

```
backend/
│
├── app/
│   ├── main_multi.py        # FastAPI entry point
│   ├── artifacts/           # Trained model files
│   ├── routers/             # API route definitions
│   ├── utils/               # Helper scripts (e.g., evaluation logic)
│   ├── models/              # Pydantic schemas
│   └── services/            # Prediction and inference logic
│
├── requirements.txt         # Python dependencies
└── README.md                # Project documentation
```

---

## API Endpoints

| Endpoint | Method | Description |
|-----------|--------|-------------|
| `/evaluate/{model}` | `POST` | Upload a CSV file with ground-truth labels for evaluation |
| `/predict/{model}` | `POST` | Upload a CSV without labels for prediction |
| `/model_card/{model}` | `GET` | Retrieve model metadata (training details, metrics, etc.) |

Example request using **curl**:

```bash
curl -X POST "http://localhost:8000/evaluate/koi" -F "file=@/path/to/dataset.csv"
```

---

## Technologies Used

- **FastAPI**
- **Python**
- **scikit-learn**
- **pandas**
- **NumPy**
- **uvicorn**

---

## Notes

- Ensure the correct model artifacts exist inside `backend/app/artifacts/`.
- CSV input files should include valid headers compatible with the model.
- The server automatically detects if the dataset contains labels for evaluation or prediction.

---

## Team

**Stellar Detectives**  
Contributors to ExoVision — NASA Space Apps Challenge 2025.

---

## License

This project is licensed under the MIT License.