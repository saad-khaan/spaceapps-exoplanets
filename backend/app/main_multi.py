# main_multi.py
# One backend, multiple models — KOI, K2, TESS — each with its own artifacts & preprocessing

import os
import io
import csv
import json
from dataclasses import dataclass
from typing import Any, Callable, Dict, List, Optional, Tuple

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.metrics import (
    accuracy_score, f1_score, balanced_accuracy_score,
    classification_report, confusion_matrix
)

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

# ============================================================
# Shared helpers
# ============================================================
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
                             keep_asymmetric: bool,
                             min_den: float) -> Tuple[pd.DataFrame, List[str]]:
    """
    Converts paired *_err1/*_err2 columns into <base>_rel_error (and optional asymmetric rel errors),
    then drops the raw error columns. Works with exact suffixes '_err1'/'_err2'.
    """
    df_out = df_in.copy()
    err1_cols = [c for c in df_out.columns if c.endswith("_err1")]
    base_to_errs = {}
    for e1 in err1_cols:
        base = e1[:-5]  # strip "_err1"
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
        denom = np.maximum(np.abs(val), min_den)
        rel_err = abs_err_mean / denom
        new_cols[f"{base}_rel_error"] = rel_err

        if keep_asymmetric:
            new_cols[f"{base}_rel_err_upper"] = err1 / denom
            new_cols[f"{base}_rel_err_lower"] = err2 / denom

    for k, v in new_cols.items():
        df_out[k] = v

    drop_cols_local = []
    for base, (e1, e2) in base_to_errs.items():
        drop_cols_local.extend([e1, e2])
    df_out = df_out.drop(columns=drop_cols_local, errors="ignore")

    return df_out, sorted(new_cols.keys())

# ============================================================
# Model spec & registry
# ============================================================
@dataclass
class ModelSpec:
    slug: str
    # Artifacts
    pipeline_path: str
    label_encoder_path: Optional[str]
    feature_names_path: Optional[str]
    # Preprocessing config
    label_col: str
    keep_asymmetric: bool
    min_den: float
    header_identifiers: List[str]
    # KOI-only cols to drop
    koi_cols_to_drop: Optional[List[str]] = None
    # K2-only drops & one-hot
    k2_cols_to_drop: Optional[List[str]] = None
    k2_drop_lim_cols: bool = False
    k2_one_hot_cols: Optional[List[str]] = None
    # TESS-only drops & lim flag
    tess_cols_to_drop: Optional[List[str]] = None
    tess_drop_lim_cols: bool = False
    # Functions
    preprocess_fn: Optional[Callable[[bytes], pd.DataFrame]] = None
    # Loaded runtime objects
    pipe: Any = None
    class_names: Optional[List[str]] = None
    train_features: Optional[List[str]] = None

REGISTRY: Dict[str, ModelSpec] = {}

# ============================================================
# KOI model spec + preprocessing
# ============================================================
KOI_SPEC = ModelSpec(
    slug="koi",
    pipeline_path="artifacts/koi/koi_best_pipeline.joblib",
    label_encoder_path="artifacts/koi/koi_label_encoder.joblib",
    feature_names_path="artifacts/koi/koi_feature_names.json",
    label_col="koi_pdisposition",
    keep_asymmetric=False,
    min_den=1e-12,
    header_identifiers=["koi_period", "koi_depth", "koi_duration", "koi_pdisposition"],
    koi_cols_to_drop=[
        "kepid", "kepoi_name", "kepler_name",
        "koi_disposition", "koi_score",
        "koi_fpflag_nt", "koi_fpflag_ss", "koi_fpflag_co", "koi_fpflag_ec",
        "koi_tce_plnt_num", "koi_tce_delivname"
    ],
)

def preprocess_koi(content: bytes, spec: ModelSpec) -> pd.DataFrame:
    hdr = detect_header_row_from_bytes(content, spec.header_identifiers)
    text = content.decode("utf-8", errors="ignore")
    df = pd.read_csv(io.StringIO(text), header=hdr)

    df.dropna(how="all", inplace=True)
    df.dropna(axis=1, how="all", inplace=True)

    if spec.koi_cols_to_drop:
        df = df.drop(columns=spec.koi_cols_to_drop, errors="ignore")

    df, _ = add_uncertainty_features(df, keep_asymmetric=spec.keep_asymmetric, min_den=spec.min_den)

    if spec.label_col in df.columns:
        df = df.drop(columns=[spec.label_col])

    df = df.apply(pd.to_numeric, errors="coerce")

    if spec.train_features is not None:
        for col in spec.train_features:
            if col not in df.columns:
                df[col] = np.nan
        extra = [c for c in df.columns if c not in spec.train_features]
        if extra:
            df = df.drop(columns=extra)
        df = df[spec.train_features]

    return df

KOI_SPEC.preprocess_fn = lambda content: preprocess_koi(content, KOI_SPEC)

# ============================================================
# K2 model spec + preprocessing
# ============================================================
K2_SPEC = ModelSpec(
    slug="k2",
    pipeline_path="artifacts/k2/k2_randomforest_pipeline.joblib",
    label_encoder_path="artifacts/k2/k2_randomforest_label_encoder.joblib",
    feature_names_path="artifacts/k2/k2_randomforest_feature_names.json",
    label_col="disposition",
    keep_asymmetric=False,
    min_den=1e-12,
    header_identifiers=["pl_orbper", "pl_rade", "st_teff", "disposition"],
    k2_cols_to_drop=[
        "pl_name", "hostname", "disp_refname", "pl_refname", "st_refname", "sy_refname",
        "rastr", "ra", "decstr", "dec",
        "rowupdate", "pl_pubdate", "releasedate",
        "default_flag", "pl_controv_flag"
    ],
    k2_drop_lim_cols=True,
    k2_one_hot_cols=["discoverymethod", "disc_facility", "soltype"],
)

def preprocess_k2(content: bytes, spec: ModelSpec) -> pd.DataFrame:
    hdr = detect_header_row_from_bytes(content, spec.header_identifiers)
    text = content.decode("utf-8", errors="ignore")
    df = pd.read_csv(io.StringIO(text), header=hdr)

    df.dropna(how="all", inplace=True)
    df.dropna(axis=1, how="all", inplace=True)

    if spec.k2_cols_to_drop:
        df = df.drop(columns=spec.k2_cols_to_drop, errors="ignore")

    if spec.k2_drop_lim_cols:
        lim_cols = [c for c in df.columns if str(c).endswith("lim")]
        if lim_cols:
            df = df.drop(columns=lim_cols, errors="ignore")

    df, _ = add_uncertainty_features(df, keep_asymmetric=spec.keep_asymmetric, min_den=spec.min_den)

    if spec.k2_one_hot_cols:
        present = [c for c in spec.k2_one_hot_cols if c in df.columns]
        if present:
            df = pd.get_dummies(df, columns=present, dummy_na=True)

    if spec.label_col in df.columns:
        df = df.drop(columns=[spec.label_col])

    df = df.apply(pd.to_numeric, errors="coerce")

    # Add *_was_missing flags (done in training BEFORE split)
    for col in list(df.columns):
        if df[col].isna().any():
            df[f"{col}_was_missing"] = df[col].isna().astype(int)

    # Strict alignment to training features (no dynamic drops at inference)
    if spec.train_features is not None:
        for col in spec.train_features:
            if col not in df.columns:
                df[col] = 0 if col.endswith("_was_missing") else np.nan
        extra = [c for c in df.columns if c not in spec.train_features]
        if extra:
            df = df.drop(columns=extra)
        df = df[spec.train_features]

    return df

K2_SPEC.preprocess_fn = lambda content: preprocess_k2(content, K2_SPEC)

# ============================================================
# TESS model spec + preprocessing
# ============================================================
TESS_SPEC = ModelSpec(
    slug="tess",
    pipeline_path="artifacts/tess/histgb_best_pipeline.joblib",
    label_encoder_path="artifacts/tess/histgb_label_encoder.joblib",
    feature_names_path="artifacts/tess/histgb_feature_names.json",
    label_col="tfopwg_disp",
    keep_asymmetric=False,
    min_den=1e-12,
    header_identifiers=["tfopwg_disp", "toi_period", "toi_depth"],
    tess_cols_to_drop=["toi", "tid", "rastr", "decstr", "toi_created", "rowupdate"],
    tess_drop_lim_cols=True,
)

def preprocess_tess(content: bytes, spec: ModelSpec) -> pd.DataFrame:
    # 1) detect header and load CSV
    hdr = detect_header_row_from_bytes(content, spec.header_identifiers)
    text = content.decode("utf-8", errors="ignore")
    df = pd.read_csv(io.StringIO(text), header=hdr)

    # 2) drop empty rows/cols
    df.dropna(how="all", inplace=True)
    df.dropna(axis=1, how="all", inplace=True)

    # 3) drop TESS-specific non-predictive columns
    if spec.tess_cols_to_drop:
        df = df.drop(columns=spec.tess_cols_to_drop, errors="ignore")

    # 4) drop *_lim columns
    if spec.tess_drop_lim_cols:
        lim_cols = [c for c in df.columns if str(c).endswith("lim")]
        if lim_cols:
            df = df.drop(columns=lim_cols, errors="ignore")

    # 5) add uncertainty features, then drop raw *_err1/_err2
    df, _ = add_uncertainty_features(df, keep_asymmetric=spec.keep_asymmetric, min_den=spec.min_den)

    # 6) remove label column at inference if present
    if spec.label_col in df.columns:
        df = df.drop(columns=[spec.label_col])

    # 7) numeric coercion (imputer lives in the pipeline)
    df = df.apply(pd.to_numeric, errors="coerce")

    # 8) strict alignment to training feature order
    if spec.train_features is not None:
        for col in spec.train_features:
            if col not in df.columns:
                df[col] = np.nan
        extra = [c for c in df.columns if c not in spec.train_features]
        if extra:
            df = df.drop(columns=extra)
        df = df[spec.train_features]

    return df

TESS_SPEC.preprocess_fn = lambda content: preprocess_tess(content, TESS_SPEC)

# ============================================================
# Registry loading
# ============================================================
def _load_feature_names(path: Optional[str]) -> Optional[List[str]]:
    if not path or not os.path.exists(path):
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            names = json.load(f)
            if isinstance(names, list) and all(isinstance(c, str) for c in names):
                return names
    except Exception:
        pass
    return None

def _load_model(spec: ModelSpec) -> None:
    print(f"[startup] Loading model '{spec.slug}'")
    spec.pipe = joblib.load(spec.pipeline_path)
    if spec.label_encoder_path and os.path.exists(spec.label_encoder_path):
        try:
            le = joblib.load(spec.label_encoder_path)
            spec.class_names = list(le.classes_) if hasattr(le, "classes_") else None
        except Exception:
            spec.class_names = None
    spec.train_features = _load_feature_names(spec.feature_names_path)
    print(f"[startup] -> classes: {spec.class_names}")
    print(f"[startup] -> features: {len(spec.train_features or [])}")

for s in (KOI_SPEC, K2_SPEC, TESS_SPEC):
    _load_model(s)
    REGISTRY[s.slug] = s

DEFAULT_MODEL = "koi"  # change default if you prefer

def _get_spec(slug: Optional[str]) -> ModelSpec:
    key = slug or DEFAULT_MODEL
    if key not in REGISTRY:
        raise HTTPException(400, f"Unknown model '{key}'. Available: {list(REGISTRY.keys())}")
    return REGISTRY[key]

# ============================================================
# FastAPI app
# ============================================================
app = FastAPI(title="Multi-Model Inference API", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],    # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")

@app.get("/models")
def models():
    return {"available": list(REGISTRY.keys()), "default": DEFAULT_MODEL}

@app.get("/health")
def health(model: Optional[str] = Query(None)):
    spec = _get_spec(model)
    # report if model_card.json exists
    base_dir = os.path.dirname(spec.pipeline_path)
    card_path = os.path.join(base_dir, "model_card.json")
    return {
        "status": "ok",
        "sklearn": sklearn.__version__,
        "model": spec.slug,
        "class_names": spec.class_names,
        "has_feature_names": spec.train_features is not None,
        "has_model_card": os.path.exists(card_path),
    }

@app.get("/model_card")
def model_card(model: Optional[str] = Query(None)):
    """
    Serve the static model_card.json placed alongside model artifacts.
    """
    spec = _get_spec(model)
    base_dir = os.path.dirname(spec.pipeline_path)
    card_path = os.path.join(base_dir, "model_card.json")
    if not os.path.exists(card_path):
        raise HTTPException(404, f"model_card.json not found for model '{spec.slug}'")
    try:
        with open(card_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(500, f"Failed to load model_card.json: {e}")

# ----------------- Endpoints -----------------
@app.post("/predict")
async def predict(file: UploadFile = File(...),
                  model: Optional[str] = Query(None)) -> Dict[str, Any]:
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "Please upload a .csv file.")
    spec = _get_spec(model)
    content = await file.read()

    try:
        X = spec.preprocess_fn(content) if spec.preprocess_fn else None
        if X is None:
            raise ValueError("No preprocessing function configured.")
    except Exception as e:
        raise HTTPException(400, f"Preprocessing error: {e}")

    try:
        pred_idx = spec.pipe.predict(X).tolist()
        pred_labels = [spec.class_names[i] for i in pred_idx] if spec.class_names is not None else pred_idx
        u, c = np.unique(pred_idx, return_counts=True)
        counts_by_class = {
            (spec.class_names[i] if spec.class_names is not None else int(i)): int(n)
            for i, n in zip(u, c)
        }
        return {
            "model": spec.slug,
            "n_rows": int(X.shape[0]),
            "pred_labels": pred_labels,
            "class_names": spec.class_names,
            "counts_by_class": counts_by_class
        }
    except Exception as e:
        raise HTTPException(500, f"Inference error: {e}")

@app.post("/predict_csv")
async def predict_csv(file: UploadFile = File(...),
                      model: Optional[str] = Query(None)) -> Dict[str, str]:
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "Please upload a .csv file.")
    spec = _get_spec(model)
    content = await file.read()

    hdr = detect_header_row_from_bytes(content, spec.header_identifiers)
    raw_df = pd.read_csv(io.StringIO(content.decode("utf-8", errors="ignore")), header=hdr)

    X = spec.preprocess_fn(content)
    pred_idx = spec.pipe.predict(X).tolist()
    pred_labels = [spec.class_names[i] for i in pred_idx] if spec.class_names is not None else pred_idx

    out_df = raw_df.copy()
    out_df["prediction"] = pred_labels

    if hasattr(spec.pipe[-1], "predict_proba"):
        try:
            P = spec.pipe.predict_proba(X)
            out_df["prediction_confidence"] = P.max(axis=1)
        except Exception:
            pass

    buf = io.StringIO()
    out_df.to_csv(buf, index=False)
    return {"model": spec.slug, "csv_data_url": "data:text/csv;charset=utf-8," + buf.getvalue()}

@app.post("/evaluate")
async def evaluate(file: UploadFile = File(...),
                   model: Optional[str] = Query(None)) -> Dict[str, Any]:
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "Please upload a .csv file.")
    spec = _get_spec(model)
    content = await file.read()

    hdr = detect_header_row_from_bytes(content, spec.header_identifiers)
    raw_df = pd.read_csv(io.StringIO(content.decode("utf-8", errors="ignore")), header=hdr)
    if spec.label_col not in raw_df.columns:
        raise HTTPException(400, f"Label column '{spec.label_col}' not found in the uploaded CSV.")

    X = spec.preprocess_fn(content)
    y_pred_idx = spec.pipe.predict(X)

    y_true_raw = raw_df[spec.label_col].astype(str)
    mask = y_true_raw.notna()

    if spec.class_names is not None:
        mapping = {lbl: i for i, lbl in enumerate(spec.class_names)}
        y_true_idx = y_true_raw.map(mapping)
        mask = mask & y_true_idx.notna()
        y_true_idx = y_true_idx.astype(int).to_numpy()
    else:
        y_true_idx = pd.to_numeric(y_true_raw, errors="coerce")
        mask = mask & y_true_idx.notna()
        y_true_idx = y_true_idx.astype(int).to_numpy()

    y_pred_idx = np.asarray(y_pred_idx)
    if y_pred_idx.shape[0] != mask.shape[0]:
        raise HTTPException(500, "Shape mismatch between predictions and labels after preprocessing.")

    y_true_eval = y_true_idx[mask.to_numpy()]
    y_pred_eval = y_pred_idx[mask.to_numpy()]

    if y_true_eval.size == 0:
        raise HTTPException(400, "No valid rows with recognizable ground-truth labels to evaluate.")

    acc  = float(accuracy_score(y_true_eval, y_pred_eval))
    f1m  = float(f1_score(y_true_eval, y_pred_eval, average="macro"))
    bacc = float(balanced_accuracy_score(y_true_eval, y_pred_eval))

    labels_range = list(range(len(spec.class_names))) if spec.class_names is not None else None
    cm = confusion_matrix(y_true_eval, y_pred_eval, labels=labels_range).tolist() \
         if labels_range is not None else confusion_matrix(y_true_eval, y_pred_eval).tolist()

    cr = classification_report(
        y_true_eval, y_pred_eval,
        labels=labels_range,
        target_names=spec.class_names if spec.class_names is not None else None,
        output_dict=True,
        zero_division=0
    )

    u, c = np.unique(y_pred_eval, return_counts=True)
    counts_by_class = {
        (spec.class_names[i] if spec.class_names is not None else int(i)): int(n)
        for i, n in zip(u, c)
    }

    return {
        "model": spec.slug,
        "evaluated_rows": int(y_true_eval.shape[0]),
        "accuracy": acc,
        "macro_f1": f1m,
        "balanced_accuracy": bacc,
        "confusion_matrix": {"labels": spec.class_names, "matrix": cm},
        "classification_report": cr,
        "class_names": spec.class_names,
        "prediction_counts": counts_by_class
    }
