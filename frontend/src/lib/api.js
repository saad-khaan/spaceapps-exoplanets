import { API_BASE } from "../missions/config";

function buildUrl(path, model) {
  const u = new URL(path, API_BASE);
  if (model) u.searchParams.set("model", model);
  return u.toString();
}

async function postFile(url, file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) {
    let msg = res.statusText;
    try { msg = (await res.json()).detail || msg; } catch {}
    const e = new Error(msg); e.status = res.status; throw e;
  }
  return res.json();
}

export const api = {
  evaluate(file, model) { return postFile(buildUrl("/evaluate", model), file); },
  predict(file, model)  { return postFile(buildUrl("/predict",  model), file); },
  predictCsv(file, model){return postFile(buildUrl("/predict_csv", model), file);},
};