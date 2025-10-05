# backend/app/main.py
# Inference + evaluation API for a pre-trained sklearn pipeline.
# Robust CSV reader (header detection + delimiter sniffing) and
# column normalization so "koi_pdisposition" is always found.

import io
import csv
import unicodedata
from pathlib import Path
from typing import Optional, List

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sklearn.metrics import accuracy_score, f1_score, classification_report, confusion_matrix

# ────────────────────────────────────────────────────────────────────────────────
# App & CORS
# ────────────────────────────────────────────────────────────────────────────────
app = FastAPI(title="Exoplanet Inference API", version="1.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],            # relax for local dev; restrict in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ────────────────────────────────────────────────────────────────────────────────
# Model locations (pre-trained)
# ────────────────────────────────────────────────────────────────────────────────
MODEL_DIR     = Path(__file__).resolve().parent / "model"
PIPELINE_PATH = MODEL_DIR / "best_pipeline.joblib"
ENCODER_PATH  = MODEL_DIR / "label_encoder.joblib"

_PIPELINE = None
_ENCODER  = None  # optional sklearn LabelEncoder

# ────────────────────────────────────────────────────────────────────────────────
# CSV helpers: header detection, delimiter sniffing, normalization
# ────────────────────────────────────────────────────────────────────────────────
def detect_header_row_from_bytes(content: bytes, tokens: List[str], max_lines: int = 200) -> int:
    """
    Heuristically find the header row by scanning the first `max_lines` lines
    and checking if any of the `tokens` is present (case/space-insensitive).
    """
    text = content.decode("utf-8", errors="replace")
    sio = io.StringIO(text)
    reader = csv.reader(sio)
    for i, row in enumerate(reader):
        if i >= max_lines:
            break
        lower = [normalize_name(c) for c in row]
        for t in tokens:
            if normalize_name(t) in lower:
                return i
    return 0

def tolerant_read_csv(content: bytes, header_tokens: Optional[List[str]] = None) -> pd.DataFrame:
    """
    Read CSV bytes robustly:
      1) detect header row by tokens,
      2) sniff delimiter with csv.Sniffer (fallbacks: , \t ; |),
      3) read with pandas using (header=hdr, sep=sep) and skip bad lines.
    If still 1 column, brute-force common separators.
    """
    text = content.decode("utf-8", errors="replace")
    sample = text[:10000]
    hdr = detect_header_row_from_bytes(
        content,
        header_tokens or ["koi_pdisposition", "tfopwg_disposition", "disposition",
                          "koi_period", "pl_orbper", "pl_rade", "st_teff"],
        max_lines=200,
    )
    # sniff delimiter
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=",;\t|")
        sep = dialect.delimiter
    except Exception:
        if "," in sample:
            sep = ","
        elif "\t" in sample:
            sep = "\t"
        elif ";" in sample:
            sep = ";"
        elif "|" in sample:
            sep = "|"
        else:
            sep = ","

    df = pd.read_csv(
        io.BytesIO(content),
        engine="python",
        sep=sep,
        header=hdr,
        on_bad_lines="skip",
    )

    # if still 1 column, brute-force try common separators
    if df.shape[1] == 1:
        for alt in [",", "\t", ";", "|"]:
            try:
                df2 = pd.read_csv(
                    io.BytesIO(content),
                    engine="python",
                    sep=alt,
                    header=hdr,
                    on_bad_lines="skip",
                )
                if df2.shape[1] > 1:
                    df = df2
                    break
            except Exception:
                pass

    return df

def _clean_unicode_spaces(s: str) -> str:
    # collapse any Unicode Zs (space separators) into ASCII spaces
    return "".join(" " if unicodedata.category(ch) == "Zs" else ch for ch in s)

def normalize_name(s: str) -> str:
    if s is None:
        return ""
    s = s.replace("\ufeff", "")  # strip BOM
    s = _clean_unicode_spaces(s)
    return s.strip().lower()

def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = [normalize_name(c) for c in df.columns]
    return df

def find_label_column(df: pd.DataFrame, label_col: Optional[str]) -> Optional[str]:
    """
    Return the actual column name (raw) matching label_col, or auto-detect
    from common names if label_col is None. Comparison is normalized.
    """
    norm_map = {normalize_name(c): c for c in df.columns}
    if label_col:
        want = normalize_name(label_col)
        if want in norm_map:
            return norm_map[want]
    for alias in ["koi_pdisposition", "tfopwg_disposition", "disposition"]:
        want = normalize_name(alias)
        if want in norm_map:
            return norm_map[want]
    return None

# ────────────────────────────────────────────────────────────────────────────────
# Model utilities
# ────────────────────────────────────────────────────────────────────────────────
def warmup():
    """Load the pre-trained pipeline (+ optional label encoder) once."""
    global _PIPELINE, _ENCODER
    if _PIPELINE is None:
        if not PIPELINE_PATH.exists():
            raise RuntimeError(f"Missing model file: {PIPELINE_PATH}")
        _PIPELINE = joblib.load(PIPELINE_PATH)
        print("✅ Loaded pipeline:", PIPELINE_PATH)

    if _ENCODER is None and ENCODER_PATH.exists():
        _ENCODER = joblib.load(ENCODER_PATH)
        print("✅ Loaded label encoder:", ENCODER_PATH)

def align_features(df: pd.DataFrame, expected: Optional[List[str]]) -> pd.DataFrame:
    """If pipeline exposes feature_names_in_, add missing cols as NaN and order them."""
    if not expected:
        return df
    for col in expected:
        if col not in df.columns:
            df[col] = np.nan
    return df[expected]

# ────────────────────────────────────────────────────────────────────────────────
# Routes
# ────────────────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "status": "ok",
        "endpoints": [
            "POST /api/model/warmup",
            "POST /api/model/peek-csv",
            "POST /api/model/predict-csv?limit=100&proba=false",
            "POST /api/model/evaluate-csv?label_col=koi_pdisposition",
        ],
    }

@app.post("/api/model/warmup")
def api_warmup():
    warmup()
    feats = getattr(_PIPELINE, "feature_names_in_", None)
    return {"warmed": True, "expected_features": list(feats) if feats is not None else None}

@app.post("/api/model/peek-csv")
async def api_peek_csv(file: UploadFile = File(...), nrows: int = 1):
    content = await file.read()
    if not content:
        raise HTTPException(400, "Empty file.")
    df = tolerant_read_csv(content)
    df = normalize_columns(df)
    return {
        "columns": list(df.columns),
        "sample": df.head(max(1, nrows)).to_dict(orient="records"),
    }

@app.post("/api/model/predict-csv")
async def api_predict_csv(
    file: UploadFile = File(...),
    limit: int = 100,
    proba: bool = False,
):
    """
    Upload a *feature-only* CSV and get predictions.
    If the CSV accidentally contains a label column, it is dropped automatically.
    """
    warmup()

    content = await file.read()
    if not content:
        raise HTTPException(400, "Empty file.")

    df = tolerant_read_csv(content)
    df = normalize_columns(df)

    # drop labels if present (case/space-insensitive)
    for alias in ["koi_pdisposition", "tfopwg_disposition", "disposition"]:
        raw = find_label_column(df, alias)
        if raw:
            df.drop(columns=[raw], inplace=True)

    # feature alignment (if pipeline exposes names)
    feats = getattr(_PIPELINE, "feature_names_in_", None)
    df = align_features(df, list(feats) if feats is not None else None)

    # predict
    y_pred = _PIPELINE.predict(df)

    # probability (optional)
    scores = None
    if proba and hasattr(_PIPELINE, "predict_proba"):
        P = _PIPELINE.predict_proba(df)
        scores = np.max(P, axis=1).astype(float)

    # inverse-transform numeric labels (optional)
    try:
        if _ENCODER is not None:
            y_pred = _ENCODER.inverse_transform(y_pred)
    except Exception:
        pass

    n = len(df)
    k = min(int(limit), n) if limit else n
    if scores is not None:
        preds = [{"label": str(y_pred[i]), "score": float(scores[i])} for i in range(k)]
    else:
        preds = [str(y_pred[i]) for i in range(k)]

    return {"rows_received": int(n), "rows_returned": int(k), "predictions": preds}

@app.post("/api/model/evaluate-csv")
async def api_evaluate_csv(
    file: UploadFile = File(...),
    label_col: Optional[str] = None,
):
    """
    Upload a CSV *with labels* and get metrics:
      accuracy, macro-F1, per-class report, confusion matrix.
    If label_col is omitted, we auto-detect (koi_pdisposition / tfopwg_disposition / disposition).
    """
    warmup()

    content = await file.read()
    if not content:
        raise HTTPException(400, "Empty file.")

    df = tolerant_read_csv(content)
    df = normalize_columns(df)

    raw_label = find_label_column(df, label_col)
    if not raw_label:
        raise HTTPException(
            400,
            "No label column found. Provide ?label_col=... or include one of: "
            "koi_pdisposition, tfopwg_disposition, disposition."
        )

    y_true = df[raw_label].astype(str).values
    X = df.drop(columns=[raw_label]).copy()

    feats = getattr(_PIPELINE, "feature_names_in_", None)
    X = align_features(X, list(feats) if feats is not None else None)

    y_pred = _PIPELINE.predict(X)

    # inverse-transform for fair string-based comparison
    try:
        if _ENCODER is not None:
            y_pred_eval = _ENCODER.inverse_transform(y_pred)
        else:
            y_pred_eval = y_pred
    except Exception:
        y_pred_eval = y_pred

    acc = float(accuracy_score(y_true, y_pred_eval))
    f1m = float(f1_score(y_true, y_pred_eval, average="macro"))
    report = classification_report(y_true, y_pred_eval, output_dict=True)
    cm = confusion_matrix(y_true, y_pred_eval).tolist()

    return {
        "n_rows": int(len(df)),
        "label_col": raw_label,
        "accuracy": acc,
        "f1_macro": f1m,
        "report": report,
        "confusion_matrix": cm,
    }