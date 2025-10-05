import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from typing import List, Optional, Dict

# Model files live in backend/app/model/
MODEL_DIR = Path(__file__).resolve().parents[1] / "model"
MODEL_PATH = MODEL_DIR / "best_pipeline.joblib"
ENCODER_PATH = MODEL_DIR / "label_encoder.joblib"

_PIPELINE = None
_ENCODER = None

# ------------------ public API ------------------

def warmup() -> None:
    global _PIPELINE, _ENCODER
    if _PIPELINE is None:
        _PIPELINE = joblib.load(MODEL_PATH)
        print(f"✅ Loaded pipeline: {MODEL_PATH}")
    if _ENCODER is None:
        _ENCODER = joblib.load(ENCODER_PATH)
        print(f"✅ Loaded label encoder: {ENCODER_PATH}")

def expected_features() -> Optional[List[str]]:
    warmup()
    if hasattr(_PIPELINE, "feature_names_in_"):
        return list(_PIPELINE.feature_names_in_)
    return None

def predict_on_csv_path(csv_path: str, limit: int = 500) -> dict:
    """
    Permissive inference against the official NASA CSV:
    - Tolerant read (no manual CSV edits)
    - Normalize headers
    - Map NASA aliases to model features
    - Derive *_rel_error from *_err1/_err2 when needed
    - Build the exact feature matrix the model expects
    - If the estimator balks at NaN, fallback-fill with 0.0 and retry
    """
    warmup()

    # 1) tolerant CSV read; keep official file untouched
    df = pd.read_csv(csv_path, engine="python", sep=None, on_bad_lines="skip")

    # 2) normalize headers (lowercase, spaces->underscores, hyphens->underscores)
    df = _normalize_columns(df)

    # 3) align to trained schema
    feats = expected_features()
    if feats:
        df_aligned, missing_before_fill, derivation_notes = _coerce_to_expected(df, feats)

        # numeric coercion where possible
        df_aligned = df_aligned.apply(pd.to_numeric, errors="ignore")

        # 4) try prediction as-is (your pipeline may include imputers)
        try:
            y_num, scores = _predict_with_pipeline(df_aligned)
        except ValueError as e:
            # fallback: simple fill for NaNs/Infs if model requires it
            msg = str(e).lower()
            if ("nan" in msg) or ("infinity" in msg) or ("inf" in msg):
                y_num, scores = _predict_with_pipeline(df_aligned.fillna(0.0))
            else:
                raise

        labels = _maybe_decode(y_num)

        n = min(len(labels), max(1, int(limit)))
        preds = [{"row": i, "label": str(labels[i]), "score": float(scores[i])} for i in range(n)]

        return {
            "rows_received": int(len(df)),
            "rows_returned": int(n),
            "missing_feature_count": int(len(missing_before_fill)),
            "missing_features": missing_before_fill[:50],
            "derivation_notes": derivation_notes,
            "predictions": preds,
            "note": "Official CSV accepted unchanged; runtime adapted columns and derived rel_error features.",
        }
    else:
        # Pipeline doesn't expose feature names; best-effort numeric subset
        X = df.select_dtypes(include=[np.number])
        y_num, scores = _predict_with_pipeline(X)
        labels = _maybe_decode(y_num)
        n = min(len(labels), max(1, int(limit)))
        preds = [{"row": i, "label": str(labels[i]), "score": float(scores[i])} for i in range(n)]
        return {
            "rows_received": int(len(df)),
            "rows_returned": int(n),
            "predictions": preds,
            "note": "Pipeline has no feature_names_in_; passed numeric subset from official CSV.",
        }

# ------------------ core helpers ------------------

def _predict_with_pipeline(X: pd.DataFrame):
    y_num = _PIPELINE.predict(X)
    if hasattr(_PIPELINE, "predict_proba"):
        proba = _PIPELINE.predict_proba(X)
        scores = np.max(proba, axis=1).astype(float).tolist()
    else:
        scores = [1.0] * len(y_num)
    return y_num, scores

def _maybe_decode(y_num: np.ndarray):
    try:
        return _ENCODER.inverse_transform(y_num)
    except Exception:
        return y_num

def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    def norm(c: str) -> str:
        return (
            str(c)
            .strip()
            .lower()
            .replace(" ", "_")
            .replace("-", "_")
            .replace("__", "_")
        )
    out = df.copy()
    out.columns = [norm(c) for c in df.columns]
    return out

def _alias_map() -> Dict[str, str]:
    """
    Map common NASA Exoplanet Archive cumulative KOI headers (normalized) to your model features.
    Extend freely if your file uses additional variants.
    """
    aliases = {
        # KOI false positive flags (usually already named koi_fpflag_*)
        "koi_fpflag_nt": "koi_fpflag_nt",
        "koi_fpflag_ss": "koi_fpflag_ss",
        "koi_fpflag_co": "koi_fpflag_co",
        "koi_fpflag_ec": "koi_fpflag_ec",

        # Canonical KOI features
        "koi_period": "koi_period",
        "koi_time0bk": "koi_time0bk",
        "koi_impact": "koi_impact",
        "koi_duration": "koi_duration",
        "koi_depth": "koi_depth",
        "koi_prad": "koi_prad",
        "koi_teq": "koi_teq",
        "koi_insol": "koi_insol",
        "koi_model_snr": "koi_model_snr",
        "koi_steff": "koi_steff",
        "koi_slogg": "koi_slogg",
        "koi_srad": "koi_srad",
        "ra": "ra",
        "dec": "dec",
        "koi_kepmag": "koi_kepmag",

        # Frequent archive variants / synonyms (normalized)
        "kepmag": "koi_kepmag",
        "teff": "koi_steff",
        "logg": "koi_slogg",
        "srad": "koi_srad",
        "period": "koi_period",
        "t0": "koi_time0bk",
        "time0": "koi_time0bk",
        "impact": "koi_impact",
        "duration": "koi_duration",
        "depth": "koi_depth",
        "prad": "koi_prad",
        "teq": "koi_teq",
        "insol": "koi_insol",
        "model_snr": "koi_model_snr",
        "ra_deg": "ra",
        "dec_deg": "dec",

        # Pre-map *_rel_error if the CSV already contains them
        "koi_period_rel_error": "koi_period_rel_error",
        "koi_time0bk_rel_error": "koi_time0bk_rel_error",
        "koi_impact_rel_error": "koi_impact_rel_error",
        "koi_duration_rel_error": "koi_duration_rel_error",
        "koi_depth_rel_error": "koi_depth_rel_error",
        "koi_prad_rel_error": "koi_prad_rel_error",
        "koi_insol_rel_error": "koi_insol_rel_error",
        "koi_steff_rel_error": "koi_steff_rel_error",
        "koi_slogg_rel_error": "koi_slogg_rel_error",
        "koi_srad_rel_error": "koi_srad_rel_error",
    }
    # also identity-map expected keys (idempotent safety)
    for k in list(aliases.values()):
        aliases[k] = k
    return aliases

def _coerce_to_expected(df: pd.DataFrame, expected: List[str]):
    """
    Return (df_aligned, missing_before_fill, derivation_notes)
    - Renames columns via alias map (and koi_ auto-prefix heuristic)
    - Derives *_rel_error from *_err1/_err2 when needed
    - Ensures every expected column exists (create if still missing, as NaN)
    - Keeps column order identical to 'expected'
    """
    derivation_notes = []
    df = df.copy()
    aliases = _alias_map()

    # 1) rename with alias map + koi_ auto-prefix heuristic
    rename_map = {}
    for col in df.columns:
        if col in aliases:
            rename_map[col] = aliases[col]
        elif col.startswith("koi_"):
            rename_map[col] = col
        else:
            guess = f"koi_{col}"
            if guess in expected:
                rename_map[col] = guess
    df.rename(columns=rename_map, inplace=True)

    # 2) derive *_rel_error from *_err1/_err2 when missing
    # rel_error = max(|err1|, |err2|) / max(|value|, eps)
    rel_pairs = [
        ("koi_period", "koi_period_rel_error"),
        ("koi_time0bk", "koi_time0bk_rel_error"),
        ("koi_impact", "koi_impact_rel_error"),
        ("koi_duration", "koi_duration_rel_error"),
        ("koi_depth", "koi_depth_rel_error"),
        ("koi_prad", "koi_prad_rel_error"),
        ("koi_insol", "koi_insol_rel_error"),
        ("koi_steff", "koi_steff_rel_error"),
        ("koi_slogg", "koi_slogg_rel_error"),
        ("koi_srad", "koi_srad_rel_error"),
    ]
    for base, rel_name in rel_pairs:
        if rel_name not in df.columns and base in df.columns:
            err1_name, err2_name = f"{base}_err1", f"{base}_err2"
            if err1_name in df.columns or err2_name in df.columns:
                val = pd.to_numeric(df[base], errors="coerce")
                e1 = pd.to_numeric(df[err1_name], errors="coerce") if err1_name in df.columns else 0.0
                e2 = pd.to_numeric(df[err2_name], errors="coerce") if err2_name in df.columns else 0.0
                rel = np.maximum(np.abs(e1), np.abs(e2)) / np.maximum(np.abs(val), 1e-12)
                df[rel_name] = rel.replace([np.inf, -np.inf], np.nan).fillna(0.0)
                derivation_notes.append(f"derived {rel_name} from {err1_name}/{err2_name}")

    # 3) boolean KOI flags: if present without koi_ prefix, coerce to 0/1 and map
    for f in ["koi_fpflag_nt", "koi_fpflag_ss", "koi_fpflag_co", "koi_fpflag_ec"]:
        if f not in df.columns:
            bare = f.replace("koi_", "")
            if bare in df.columns:
                df[f] = _to01(df[bare])
                derivation_notes.append(f"coerced {bare} -> {f} (0/1)")

    # 4) ensure every expected feature exists (create missing as NaN)
    missing = [c for c in expected if c not in df.columns]
    for m in missing:
        df[m] = np.nan

    # 5) return aligned frame with exact column order
    df_aligned = df[expected]
    return df_aligned, missing, derivation_notes

def _to01(series: pd.Series) -> pd.Series:
    s = series.astype(str).str.strip().str.lower()
    return s.isin(["1", "true", "t", "yes", "y"]).astype(int)