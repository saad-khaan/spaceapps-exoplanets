# main.py
# FastAPI inference server for your pretrained KOI SVM pipeline
# - Loads pipeline + LabelEncoder + training feature order
# - Reuses your header detection + uncertainty-feature preprocessing
# - Adds startup diagnostics and a helpful /health endpoint
# - Adds / root redirect to /docs so you don't see 404

import os
import io
import csv
import json
from typing import List, Optional, Dict, Any

import joblib
import numpy as np
import pandas as pd
import sklearn
import warnings
from sklearn.metrics import (
    accuracy_score, f1_score, balanced_accuracy_score,
    classification_report, confusion_matrix
)

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

# =========================
# Training-time constants (must match your notebook)
# =========================
label_col       = "koi_pdisposition"
keep_asymmetric = False
min_den         = 1e-12

cols_to_drop = [
    "kepid", "kepoi_name", "kepler_name",
    "koi_disposition", "koi_score",
    "koi_fpflag_nt", "koi_fpflag_ss", "koi_fpflag_co", "koi_fpflag_ec",
    "koi_tce_plnt_num", "koi_tce_delivname"
]

header_identifiers = ["koi_period", "koi_depth", "koi_duration", label_col]

# artifact paths (relative to project root)
PIPE_PATH = "artifacts/koi/best_pipeline.joblib"
LE_PATH   = "artifacts/koi/label_encoder.joblib"
FEATURE_NAMES_JSON = "artifacts/koi/feature_names.json"

# Optional: warn if runtime sklearn mismatches your training version
TRAINED_SKLEARN = "1.7.2"   # set this to the version you used in Colab when saving
if sklearn.__version__ != TRAINED_SKLEARN:
    warnings.warn(
        f"Model trained with scikit-learn {TRAINED_SKLEARN}, "
        f"but runtime has {sklearn.__version__}. Align to avoid issues."
    )

# =========================
# Startup diagnostics
# =========================
print("[startup] sklearn version:", sklearn.__version__)
print("[startup] cwd:", os.getcwd())
print("[startup] artifacts abs path:", os.path.abspath("artifacts"))
for p in ["artifacts", PIPE_PATH, LE_PATH, FEATURE_NAMES_JSON]:
    print(f"[startup] exists({p}) ->", os.path.exists(p))

# =========================
# Load artifacts
# =========================
try:
    pipe = joblib.load(PIPE_PATH)
    print("[startup] pipeline loaded OK")
except Exception as e:
    raise RuntimeError(f"Could not load pipeline from {PIPE_PATH}: {e}")

try:
    le = joblib.load(LE_PATH)
    print("[startup] loaded label_encoder type:", type(le))
    if hasattr(le, "classes_"):
        class_names = list(le.classes_)
        print("[startup] label_encoder classes:", class_names)
    else:
        print("[startup] label_encoder has no 'classes_' attribute")
        class_names = None
except Exception as e:
    le = None
    class_names = None
    print("[startup] failed to load label_encoder:", repr(e))

def load_training_feature_names() -> Optional[List[str]]:
    try:
        with open(FEATURE_NAMES_JSON, "r", encoding="utf-8") as f:
            names = json.load(f)
            if isinstance(names, list) and all(isinstance(c, str) for c in names):
                print(f"[startup] loaded {len(names)} training feature names")
                return names
    except Exception as e:
        print("[startup] feature_names.json not loaded:", repr(e))
    return None

TRAIN_FEATURES = load_training_feature_names()

# =========================
# Preprocessing utils (match your notebook)
# =========================
def detect_header_row_from_bytes(content: bytes,
                                 identifiers: List[str],
                                 max_lines: int = 200) -> int:
    text = content.decode("utf-8", errors="ignore")
    reader = csv.reader(io.StringIO(text))
    for i, row in enumerate(reader):
        if i >= max_lines:
            break
        norm = [str(c).strip().lower() for c in row]
        for token in identifiers:
            if str(token).strip().lower() in norm:
                return i
    raise ValueError("Could not detect header. Update header_identifiers if needed.")

def add_uncertainty_features(df_in: pd.DataFrame,
                             keep_asymmetric: bool = False,
                             min_den: float = 1e-12) -> pd.DataFrame:
    df_out = df_in.copy()
    err1_cols = [c for c in df_out.columns if c.endswith("_err1")]
    base_to_errs = {}
    for e1 in err1_cols:
        base = e1[:-5]
        e2 = f"{base}_err2"
        if e2 in df_out.columns:
            base_to_errs[base] = (e1, e2)

    new_cols = {}
    for base, (e1, e2) in base_to_errs.items():
        if base not in df_out.columns:
            continue
        val  = pd.to_numeric(df_out[base], errors="coerce")
        err1 = pd.to_numeric(df_out[e1], errors="coerce").abs()
        err2 = pd.to_numeric(df_out[e2], errors="coerce").abs()

        abs_err_mean = (err1 + err2) / 2.0
        rel_err = abs_err_mean / np.maximum(np.abs(val), min_den)
        new_cols[f"{base}_rel_error"] = rel_err

        if keep_asymmetric:
            new_cols[f"{base}_rel_err_upper"] = err1 / np.maximum(np.abs(val), min_den)
            new_cols[f"{base}_rel_err_lower"] = err2 / np.maximum(np.abs(val), min_den)

    for k, v in new_cols.items():
        df_out[k] = v

    drop_cols = []
    for base, (e1, e2) in base_to_errs.items():
        drop_cols.extend([e1, e2])
    df_out = df_out.drop(columns=drop_cols, errors="ignore")
    return df_out

def preprocess_uploaded_csv(content: bytes) -> pd.DataFrame:
    # 1) detect header
    hdr = detect_header_row_from_bytes(content, header_identifiers)
    text = content.decode("utf-8", errors="ignore")
    df = pd.read_csv(io.StringIO(text), header=hdr)

    # 2) drop empty rows/cols
    df.dropna(how="all", inplace=True)
    df.dropna(axis=1, how="all", inplace=True)

    # 3) drop known columns
    df = df.drop(columns=cols_to_drop, errors="ignore")

    # 4) build uncertainty features
    df = add_uncertainty_features(df, keep_asymmetric=keep_asymmetric, min_den=min_den)

    # 5) remove label col at inference
    if label_col in df.columns:
        df = df.drop(columns=[label_col])

    # 6) numeric coercion (imputer/scaler live in the pipeline)
    df = df.apply(pd.to_numeric, errors="coerce")

    # 7) align to training order (if we have it)
    if TRAIN_FEATURES is not None:
        for col in TRAIN_FEATURES:
            if col not in df.columns:
                df[col] = np.nan
        extra = [c for c in df.columns if c not in TRAIN_FEATURES]
        if extra:
            df = df.drop(columns=extra)
        df = df[TRAIN_FEATURES]
    return df

# =========================
# FastAPI app
# =========================
app = FastAPI(title="KOI SVM Inference API", version="1.0.0")

# CORS (tighten allow_origins in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helpful root so you don't see 404 at "/"
@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")

@app.get("/health")
def health():
    return {
        "status": "ok",
        "cwd": os.getcwd(),
        "sklearn": sklearn.__version__,
        "encoder_loaded": class_names is not None,
        "class_names": class_names,
        "artifacts": {
            "pipeline": os.path.exists(PIPE_PATH),
            "label_encoder": os.path.exists(LE_PATH),
            "feature_names": os.path.exists(FEATURE_NAMES_JSON),
        },
    }

@app.post("/predict")
async def predict(file: UploadFile = File(...)) -> Dict[str, Any]:
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file.")
    content = await file.read()

    try:
        X = preprocess_uploaded_csv(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Preprocessing error: {e}")

    try:
        pred_idx = pipe.predict(X).tolist()
        pred_labels = [class_names[i] for i in pred_idx] if class_names is not None else pred_idx

        # proba intentionally omitted to keep response compact
        # if you want it back, uncomment below:
        # proba = None
        # if hasattr(pipe[-1], "predict_proba"):
        #     try:
        #         proba = pipe.predict_proba(X).tolist()
        #     except Exception:
        #         proba = None

        # compact summary for quick verification
        u, c = np.unique(pred_idx, return_counts=True)
        counts_by_class = {
            (class_names[i] if class_names is not None else int(i)): int(n)
            for i, n in zip(u, c)
        }

        return {
            "n_rows": int(X.shape[0]),
            "pred_labels": pred_labels,   # only labels
            "class_names": class_names,
            "counts_by_class": counts_by_class
            # "proba": proba
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {e}")

@app.post("/predict_csv")
async def predict_csv(file: UploadFile = File(...)) -> Dict[str, str]:
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file.")
    content = await file.read()

    hdr = detect_header_row_from_bytes(content, header_identifiers)
    raw_df = pd.read_csv(io.StringIO(content.decode("utf-8", errors="ignore")), header=hdr)
    X = preprocess_uploaded_csv(content)

    pred_idx = pipe.predict(X).tolist()
    pred_labels = [class_names[i] for i in pred_idx] if class_names is not None else pred_idx

    out_df = raw_df.copy()
    out_df["prediction"] = pred_labels

    if hasattr(pipe[-1], "predict_proba"):
        try:
            P = pipe.predict_proba(X)
            out_df["prediction_confidence"] = P.max(axis=1)
        except Exception:
            pass

    buf = io.StringIO()
    out_df.to_csv(buf, index=False)
    data_url = "data:text/csv;charset=utf-8," + buf.getvalue()
    return {"csv_data_url": data_url}

@app.post("/evaluate")
async def evaluate(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Evaluate model on a CSV that INCLUDES the ground-truth label column (koi_pdisposition).
    Returns aggregate metrics + confusion matrix + classification report.
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file.")

    content = await file.read()

    # Read raw to extract y_true BEFORE preprocess (preprocess drops label)
    try:
        hdr = detect_header_row_from_bytes(content, header_identifiers)
        raw_df = pd.read_csv(io.StringIO(content.decode("utf-8", errors="ignore")), header=hdr)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV read error: {e}")

    if label_col not in raw_df.columns:
        raise HTTPException(status_code=400, detail=f"Label column '{label_col}' not found in the uploaded CSV.")

    # Build features the same way as /predict
    try:
        X = preprocess_uploaded_csv(content)  # this drops label internally, as intended
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Preprocessing error: {e}")

    # Predictions
    try:
        y_pred_idx = pipe.predict(X)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {e}")

    # Prepare y_true as indices that match the model's class ordering
    y_true_raw = raw_df[label_col].astype(str)
    mask = y_true_raw.notna()

    if le is not None and class_names is not None:
        # Map string labels -> indices using the saved encoder
        mapping = {lbl: i for i, lbl in enumerate(class_names)}
        y_true_idx = y_true_raw.map(mapping)
        mask = mask & y_true_idx.notna()
        try:
            y_true_idx = y_true_idx.astype(int).to_numpy()
        except Exception:
            raise HTTPException(status_code=400, detail="Ground-truth labels could not be mapped to known classes.")
    else:
        # Fallback: try to interpret labels as numeric indices already
        y_true_idx = pd.to_numeric(y_true_raw, errors="coerce")
        mask = mask & y_true_idx.notna()
        y_true_idx = y_true_idx.astype(int).to_numpy()

    # Align predictions to the same valid mask (drop rows with unknown/missing GT)
    y_pred_idx = np.asarray(y_pred_idx)
    if y_pred_idx.shape[0] != mask.shape[0]:
        raise HTTPException(status_code=500, detail="Shape mismatch between predictions and labels after preprocessing.")

    y_true_eval = y_true_idx[mask.to_numpy()]
    y_pred_eval = y_pred_idx[mask.to_numpy()]

    if y_true_eval.size == 0:
        raise HTTPException(status_code=400, detail="No valid rows with recognizable ground-truth labels to evaluate.")

    # Metrics
    acc = float(accuracy_score(y_true_eval, y_pred_eval))
    f1m = float(f1_score(y_true_eval, y_pred_eval, average="macro"))
    bacc = float(balanced_accuracy_score(y_true_eval, y_pred_eval))

    labels_range = None
    target_names = None
    if class_names is not None:
        labels_range = list(range(len(class_names)))
        target_names = class_names

    # Confusion matrix (ensure consistent label order if available)
    cm = confusion_matrix(
        y_true_eval, y_pred_eval, labels=labels_range
    ).tolist() if labels_range is not None else confusion_matrix(
        y_true_eval, y_pred_eval
    ).tolist()

    # Classification report as a dict for easy JSON
    cr = classification_report(
        y_true_eval,
        y_pred_eval,
        labels=labels_range,
        target_names=target_names,
        output_dict=True,
        zero_division=0
    )

    # Add a compact prediction summary (use evaluated rows only)
    u, c = np.unique(y_pred_eval, return_counts=True)
    counts_by_class = {
        (class_names[i] if class_names is not None else int(i)): int(n)
        for i, n in zip(u, c)
    }

    resp = {
        "evaluated_rows": int(y_true_eval.shape[0]),
        "accuracy": acc,
        "macro_f1": f1m,
        "balanced_accuracy": bacc,
        "confusion_matrix": {
            "labels": class_names if class_names is not None else None,
            "matrix": cm
        },
        "classification_repor/Users/saadkhan/Downloads/best_pipeline.joblib /Users/saadkhan/Downloads/label_encoder.joblib /Users/saadkhan/Downloads/feature_names.jsont": cr,
        "class_names": class_names,
        "prediction_counts": counts_by_class
    }
    return resp