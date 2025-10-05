from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
import tempfile, os

from app.services.model_runtime import warmup, predict_on_csv_path

router = APIRouter()

@router.post("/warmup", summary="Load model+encoder into memory")
def warm():
    try:
        warmup()
        return {"warmed": True}
    except Exception as e:
        raise HTTPException(500, str(e))

@router.post("/predict-csv", summary="Upload CSV → pass to ML → return predictions")
async def predict_csv(file: UploadFile = File(...), limit: int = 500):
    """
    This route does NOT parse the CSV. It only:
      1) saves bytes to a temp file
      2) calls the ML runtime with the file PATH
      3) returns whatever the ML runtime returns
    """
    if not (file.filename or "").lower().endswith(".csv"):
        raise HTTPException(400, "Please upload a .csv file")

    # Save to a temporary file; we’ll clean it up after inference
    suffix = ".csv"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        tmp.write(await file.read())
        tmp.flush(); tmp.close()
        # Hand off to ML runtime (which handles parsing/feature prep)
        result = predict_on_csv_path(tmp.name, limit=limit)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"ML runtime failed: {e}")
    finally:
        try:
            os.unlink(tmp.name)
        except Exception:
            pass