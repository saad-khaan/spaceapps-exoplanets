// // // src/lib/api.js
// // import { API_BASE } from "../missions/config";

// // function buildUrl(path, model) {
// //   const u = new URL(path, API_BASE);   // <- always points to FastAPI base
// //   if (model) u.searchParams.set("model", model);
// //   return u.toString();
// // }

// // async function postFile(url, file) {
// //   const form = new FormData();
// //   form.append("file", file);
// //   const res = await fetch(url, { method: "POST", body: form });
// //   if (!res.ok) {
// //     let msg = res.statusText;
// //     try { msg = (await res.json()).detail || msg; } catch {}
// //     const e = new Error(msg); e.status = res.status; throw e;
// //   }
// //   return res.json();
// // }

// // export const api = {
// //   evaluate(file, model)   { return postFile(buildUrl("/evaluate",    model), file); },
// //   predict(file, model)    { return postFile(buildUrl("/predict",     model), file); },
// //   predictCsv(file, model) { return postFile(buildUrl("/predict_csv", model), file); },

// //   async getModelCard(model) {
// //     // use the path-param route so we don’t need query strings
// //     const url = new URL(`/model_card/${encodeURIComponent(model)}`, API_BASE).toString();
// //     const res = await fetch(url);
// //     if (!res.ok) {
// //       let msg = res.statusText;
// //       try { msg = await res.text(); } catch {}
// //       throw new Error(msg);
// //     }
// //     return res.json();
// //   },
// // };

// // src/lib/api.js
// import { API_BASE } from "../missions/config";

// function buildUrl(path, model, extraParams = {}) {
//   // Always points to FastAPI base
//   const u = new URL(path, API_BASE);
//   if (model) u.searchParams.set("model", model);
//   for (const [k, v] of Object.entries(extraParams || {})) {
//     if (v !== undefined && v !== null) u.searchParams.set(k, String(v));
//   }
//   return u.toString();
// }

// async function postFile(url, file) {
//   const form = new FormData();
//   form.append("file", file);
//   const res = await fetch(url, { method: "POST", body: form });
//   if (!res.ok) {
//     let msg = res.statusText;
//     try {
//       const j = await res.json();
//       msg = j.detail || msg;
//     } catch {
//       // leave msg as-is
//     }
//     const e = new Error(msg);
//     e.status = res.status;
//     throw e;
//   }
//   return res.json();
// }

// export const api = {
//   // New unified endpoint: will evaluate if labels exist, otherwise predict with top-k probs
//   analyze(file, model, { include_proba = true, top_k = 3 } = {}) {
//     return postFile(
//       buildUrl("/analyze", model, { include_proba, top_k }),
//       file
//     );
//   },

//   // Kept for backwards compatibility (used only if you call them directly)
//   evaluate(file, model)   { return postFile(buildUrl("/evaluate",    model), file); },
//   predict(file, model)    { return postFile(buildUrl("/predict",     model), file); },
//   predictCsv(file, model) { return postFile(buildUrl("/predict_csv", model), file); },

//   async getModelCard(model) {
//     // Use the path-param route so we don’t need query strings
//     const url = new URL(`/model_card/${encodeURIComponent(model)}`, API_BASE).toString();
//     const res = await fetch(url);
//     if (!res.ok) {
//       let msg = res.statusText;
//       try { msg = (await res.json()).detail || msg; } catch {}
//       throw new Error(msg);
//     }
//     return res.json();
//   },
// };

// src/lib/api.js
import { API_BASE } from "../missions/config";

function buildUrl(path, model, extraParams = {}) {
  // Always points to FastAPI base
  const u = new URL(path, API_BASE);
  if (model) u.searchParams.set("model", model);
  for (const [k, v] of Object.entries(extraParams || {})) {
    if (v !== undefined && v !== null) u.searchParams.set(k, String(v));
  }
  return u.toString();
}

async function postFile(url, file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = await res.json();
      msg = j.detail || msg;
    } catch {
      // leave msg as-is
    }
    const e = new Error(msg);
    e.status = res.status;
    throw e;
  }
  return res.json();
}

export const api = {
  // New unified endpoint: will evaluate if labels exist, otherwise predict with top-k probs
  analyze(file, model, { include_proba = true, top_k = 3 } = {}) {
    return postFile(
      buildUrl("/analyze", model, { include_proba, top_k }),
      file
    );
  },

  // Kept for backwards compatibility (used only if you call them directly)
  evaluate(file, model)   { return postFile(buildUrl("/evaluate",    model), file); },
  predict(file, model)    { return postFile(buildUrl("/predict",     model), file); },
  predictCsv(file, model) { return postFile(buildUrl("/predict_csv", model), file); },

  async getModelCard(model) {
    // Use the path-param route so we don’t need query strings
    const url = new URL(`/model_card/${encodeURIComponent(model)}`, API_BASE).toString();
    const res = await fetch(url);
    if (!res.ok) {
      let msg = res.statusText;
      try { msg = (await res.json()).detail || msg; } catch {}
      throw new Error(msg);
    }
    return res.json();
  },
};