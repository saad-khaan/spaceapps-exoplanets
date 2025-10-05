const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

async function json(res) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  async warmup() {
    const res = await fetch(`${API_URL}/api/model/warmup`, { method: "POST" });
    return json(res);
  },

  // Evaluate CSV (returns accuracy, macro F1, confusion matrix, etc)
  async evaluateCsv(file, labelCol /* optional */) {
    const fd = new FormData();
    fd.append("file", file);
    const url = new URL(`${API_URL}/api/model/evaluate-csv`);
    if (labelCol) url.searchParams.set("label_col", labelCol);
    const res = await fetch(url.toString(), { method: "POST", body: fd });
    return json(res);
  },

  // Predict CSV (returns labels or labels+proba)
  async predictCsv(file, { limit = 100, proba = false } = {}) {
    const fd = new FormData();
    fd.append("file", file);
    const url = new URL(`${API_URL}/api/model/predict-csv`);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("proba", String(proba));
    const res = await fetch(url.toString(), { method: "POST", body: fd });
    return json(res);
  },

  // Peek columns (handy to confirm the header)
  async peekCsv(file) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API_URL}/api/model/peek-csv`, { method: "POST", body: fd });
    return json(res);
  },
};