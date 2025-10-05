import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

DATA_DIR = Path(os.getenv("DATA_DIR", ROOT / "data"))
MODELS_DIR = Path(os.getenv("MODELS_DIR", ROOT / "models"))

MODEL_PATH = Path(os.getenv("MODEL_PATH", MODELS_DIR / "best_pipeline.joblib"))
ENCODER_PATH = Path(os.getenv("ENCODER_PATH", MODELS_DIR / "label_encoder.joblib"))

DATA_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)