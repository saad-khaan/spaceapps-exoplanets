const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function postFile(path, file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE_URL}${path}`, { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.detail || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  evaluate: (file) => postFile("/evaluate", file),
};