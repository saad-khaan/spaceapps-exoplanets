// UploadSection.jsx
import { useParams } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../lib/api";
import { MISSION_TO_MODEL } from "../missions/config";

/* =========================
   Small helpers
========================= */
const fmt = (x) =>
  x === null || x === undefined || Number.isNaN(x) ? "-" : Number(x).toFixed(4);
const bandClass = (v) =>
  v >= 0.8 ? "text-green-400" : v >= 0.6 ? "text-yellow-400" : "text-red-400";

const saveLast = (model, metrics) => {
  try {
    localStorage.setItem(
      `metrics:${model}`,
      JSON.stringify({
        accuracy: metrics.accuracy,
        macro_f1: metrics.macro_f1 || metrics.f1_macro,
        balanced_accuracy: metrics.balanced_accuracy,
        t: Date.now(),
      })
    );
  } catch {}
};

const loadLast = (model) => {
  try {
    const raw = localStorage.getItem(`metrics:${model}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export default function UploadSection() {
  const { missionName } = useParams(); // "KOI" | "K2" | "TESS"
  const missionKey = (missionName || "").toUpperCase();
  const model = MISSION_TO_MODEL[missionKey]; // "koi" | "k2" | "tess"

  const [file, setFile] = useState(null);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // results
  const [evalRes, setEvalRes] = useState(null); // r.mode === "evaluate"
  const [predRes, setPredRes] = useState(null); // r.mode === "predict"

  // extras
  const [normMode, setNormMode] = useState("count"); // "count" | "row"
  const [cardOpen, setCardOpen] = useState(false);
  const [modelCard, setModelCard] = useState(null);
  const last = loadLast(model);

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] ?? null);
    setError(false);
    setMsg("");
    setEvalRes(null);
    setPredRes(null);
  };

  // ✅ One endpoint now: /analyze
  const handleAnalyze = async () => {
    if (!file || !model) {
      setError(true);
      setShake(true);
      setMsg(!model ? "Unknown mission in route." : "Please choose a CSV file.");
      setTimeout(() => setShake(false), 500);
      return;
    }

    setBusy(true);
    setMsg("");
    setEvalRes(null);
    setPredRes(null);

    try {
      const r = await api.analyze(file, model);
      if (r.mode === "evaluate") {
        setEvalRes(r);
        saveLast(model, r);
        setMsg(`Analyzed ${missionKey} with ground-truth labels ✅`);
      } else {
        setPredRes(r);
        setMsg("No label column detected. Showing predictions and top-k probabilities.");
      }
    } catch (e) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const openModelCard = async () => {
    try {
      const card = await api.getModelCard(model);
      setModelCard(card);
      setCardOpen(true);
    } catch (e) {
      setMsg(`Could not load model card: ${e.message}`);
    }
  };

  // Close model card with Escape
  useEffect(() => {
    if (!cardOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setCardOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cardOpen]);

  // Build per-class rows from classification_report
  const perClassRows = useMemo(() => {
    if (!evalRes || !evalRes.classification_report) return [];
    const rows = Object.entries(evalRes.classification_report)
      .filter(([k]) => !["accuracy", "macro avg", "weighted avg"].includes(k))
      .map(([cls, m]) => ({
        cls,
        precision: Number(m.precision ?? 0),
        recall: Number(m.recall ?? 0),
        f1: Number(m["f1-score"] ?? m.f1_score ?? 0),
        support: Number(m.support ?? 0),
      }));
    rows.sort((a, b) => a.recall - b.recall); // show weakest first
    return rows;
  }, [evalRes]);

  const labels = evalRes?.confusion_matrix?.labels || evalRes?.class_names || [];
  const matrix = evalRes?.confusion_matrix?.matrix || [];

  const normalizedMatrix = useMemo(() => {
    if (normMode !== "row") return matrix;
    return matrix.map((row) => {
      const s = row.reduce((a, b) => a + b, 0) || 1;
      return row.map((v) => v / s);
    });
  }, [matrix, normMode]);

  const maxCell = useMemo(() => {
    return Math.max(...(normalizedMatrix.flat().length ? normalizedMatrix.flat() : [1]));
  }, [normalizedMatrix]);

  // prediction counts for distribution
  const predCounts = evalRes?.prediction_counts || predRes?.counts_by_class || null;

  return (
    <div
      className="
        min-h-screen 
        flex flex-col items-center justify-start
        bg-gradient-to-b from-black via-gray-900 to-black 
        text-white px-6 
        pt-44 pb-16
      "
    >
      {/* Header */}
      <h1 className="text-4xl font-bold text-blue-400 mb-2 drop-shadow-[0_0_10px_#00bfff]">
        Analyze {missionKey}
      </h1>
      <p className="text-gray-300 mb-10 text-center max-w-md">
        Upload your CSV dataset for the {missionKey} model
        {model ? "" : " (unknown route)"}.
      </p>

      {/* Divider */}
      <div className="flex items-center justify-center my-6 w-full max-w-xl">
        <div className="w-full border-t-2 border-blue-500 opacity-60"></div>
      </div>

      {/* Upload section */}
      <motion.div
        className="flex flex-col items-center mb-6"
        animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className={`border-2 px-4 py-2 rounded-md bg-gray-800 text-sm text-gray-200 focus:outline-none transition-all
            ${
              error
                ? "border-red-500 focus:ring-2 focus:ring-red-500"
                : "border-blue-400 focus:ring-2 focus:ring-blue-500"
            }`}
        />

        <AnimatePresence>
          {error && (
            <motion.p
              className="text-red-500 text-sm mt-2 font-medium"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              {msg || "Please choose a CSV file."}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Analyze + Model card */}
      <div className="flex justify-center gap-3">
        <button
          onClick={handleAnalyze}
          disabled={busy || !model}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md font-semibold shadow-lg hover:shadow-[0_0_20px_#00bfff] transition-all disabled:opacity-50"
        >
          {busy ? "Analyzing..." : "Analyze"}
        </button>
        <button
          onClick={openModelCard}
          className="bg-zinc-800 hover:bg-zinc-700 px-4 py-3 rounded-md border border-white/10"
        >
          View model card
        </button>
      </div>

      {/* Inline message */}
      {msg && !error && (
        <div className="mt-6 text-sm text-slate-200 bg-white/5 border border-white/10 rounded p-3">
          {msg}
        </div>
      )}

      {/* ===== Evaluation Results ===== */}
      {evalRes && (
        <div className="mt-8 w-full max-w-6xl space-y-6">
          <h2 className="text-xl font-semibold text-blue-300">Evaluation</h2>

          {/* KPI cards with deltas */}
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Rows" value={evalRes.evaluated_rows ?? evalRes.n_rows ?? "-"} />
            <MetricCard
              label="Accuracy"
              value={fmt(evalRes.accuracy)}
              delta={last ? evalRes.accuracy - (last.accuracy ?? 0) : null}
            />
            <MetricCard
              label="F1 (Macro)"
              value={fmt(evalRes.macro_f1 || evalRes.f1_macro)}
              delta={last ? (evalRes.macro_f1 || evalRes.f1_macro) - (last.macro_f1 ?? 0) : null}
            />
            <MetricCard
              label="Balanced Acc."
              value={fmt(evalRes.balanced_accuracy)}
              delta={last ? evalRes.balanced_accuracy - (last.balanced_accuracy ?? 0) : null}
            />
          </div>

          {/* Confusion matrix + distribution */}
          {labels.length && matrix.length ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded p-4">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">Confusion Matrix</h3>
                  <div className="ml-auto text-xs bg-zinc-800 rounded p-1">
                    <button
                      onClick={() => setNormMode("count")}
                      className={`px-2 py-1 rounded ${normMode === "count" ? "bg-zinc-700" : ""}`}
                    >
                      Counts
                    </button>
                    <button
                      onClick={() => setNormMode("row")}
                      className={`px-2 py-1 rounded ${normMode === "row" ? "bg-zinc-700" : ""}`}
                    >
                      Row-normalized
                    </button>
                  </div>
                </div>

                <div className="overflow-auto inline-block">
                  <div
                    className="grid"
                    style={{ gridTemplateColumns: `120px repeat(${labels.length}, 1fr)` }}
                  >
                    <div />
                    {labels.map((l) => (
                      <div key={"c" + l} className="text-xs text-center px-2">
                        {l}
                      </div>
                    ))}
                    {normalizedMatrix.map((row, i) => (
                      <div key={"r" + i} className="contents">
                        <div className="text-xs pr-2 py-1">{labels[i]}</div>
                        {row.map((v, j) => {
                          const raw = matrix[i][j];
                          const intensity = maxCell ? v / maxCell : 0;
                          const bg = `rgba(34,197,94,${0.12 + 0.75 * intensity})`;
                          const label = normMode === "row" ? `${(v * 100).toFixed(1)}%` : String(raw);
                          return (
                            <div
                              key={`${i}-${j}`}
                              title={`true=${labels[i]} → pred=${labels[j]}: ${label}`}
                              className="text-xs text-center py-2 border border-white/10"
                              style={{ background: bg }}
                            >
                              {label}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Prediction distribution */}
              {predCounts && (
                <div className="bg-white/5 border border-white/10 rounded p-4">
                  <h3 className="font-semibold mb-2">Prediction distribution</h3>
                  <MiniBars counts={predCounts} />
                </div>
              )}
            </div>
          ) : null}

          {/* Per-class metrics */}
          {perClassRows.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded p-4 overflow-auto">
              <h3 className="font-semibold mb-2">Per-class metrics (sorted by recall)</h3>
              <table className="w-full text-sm border-collapse">
                <thead className="text-slate-300">
                  <tr>
                    <th className="text-left py-2 border-b border-white/10">Class</th>
                    <th className="text-left py-2 border-b border-white/10">Precision</th>
                    <th className="text-left py-2 border-b border-white/10">Recall</th>
                    <th className="text-left py-2 border-b border-white/10">F1</th>
                    <th className="text-left py-2 border-b border-white/10">Support</th>
                  </tr>
                </thead>
                <tbody>
                  {perClassRows.map((r) => (
                    <tr key={r.cls} className="border-b border-white/5">
                      <td className="py-2">{r.cls}</td>
                      <td className={`py-2 ${bandClass(r.precision)}`}>{fmt(r.precision)}</td>
                      <td className={`py-2 ${bandClass(r.recall)}`}>{fmt(r.recall)}</td>
                      <td className={`py-2 ${bandClass(r.f1)}`}>{fmt(r.f1)}</td>
                      <td className="py-2">
                        <SupportBar
                          value={r.support}
                          total={perClassRows.reduce((a, b) => a + b.support, 0)}
                        />
                        <span className="text-xs text-slate-400 ml-2">{r.support}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Insights & Recommendations */}
          <Insights evalRes={evalRes} />
        </div>
      )}

      {/* ===== Predictions (no labels) ===== */}
      {predRes && (
        <div className="mt-8 w-full max-w-6xl space-y-6">
          <h2 className="text-xl font-semibold text-blue-300">Predictions</h2>

          <div className="grid sm:grid-cols-3 gap-4">
            <MetricCard label="Rows" value={predRes.n_rows ?? predRes.rows_received ?? "-"} />
            <MetricCard label="Classes" value={(predRes.class_names || []).join(", ")} />
            <MetricCard
              label="Avg. max confidence"
              value={
                Array.isArray(predRes.max_confidence) && predRes.max_confidence.length
                  ? (
                      predRes.max_confidence.reduce((a, b) => a + b, 0) /
                      predRes.max_confidence.length
                    ).toFixed(3)
                  : "-"
              }
            />
          </div>

          {/* Top-k probabilities per row */}
          {Array.isArray(predRes.topk_proba) && (
            <div className="bg-white/5 border border-white/10 rounded p-4">
              <h3 className="font-semibold mb-2">Prediction probabilities (top-k)</h3>
              <ul className="text-sm space-y-3 max-h-[60vh] overflow-auto">
                {predRes.topk_proba.map((row, i) => (
                  <li key={i} className="bg-black/30 border border-white/10 rounded px-3 py-2">
                    <div className="font-medium mb-1 text-slate-200">Sample {i + 1}</div>
                    {row.map((p, j) => (
                      <div key={j} className="flex items-center justify-between">
                        <span className="text-slate-300">{p.label}</span>
                        <span className="text-slate-400">{(p.prob * 100).toFixed(2)}%</span>
                      </div>
                    ))}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Distribution of predicted classes */}
          {predRes.counts_by_class && (
            <div className="bg-white/5 border border-white/10 rounded p-4">
              <h3 className="font-semibold mb-2">Prediction distribution</h3>
              <MiniBars counts={predRes.counts_by_class} />
            </div>
          )}

          {/* First 20 raw labels (optional) */}
          <div className="bg-white/5 border border-white/10 rounded p-4">
            <h3 className="font-semibold mb-2">First 20 predicted labels</h3>
            <ul className="text-sm space-y-1">
              {(predRes.pred_labels || predRes.predictions || []).slice(0, 20).map((p, i) => (
                <li key={i} className="bg-black/30 border border-white/10 rounded px-3 py-2">
                  {typeof p === "string" ? p : JSON.stringify(p)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Model Card Modal */}
      {cardOpen && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={() => setCardOpen(false)}
        >
          <div
            className="bg-zinc-950 border border-white/10 rounded-xl max-w-3xl w-full p-4"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Model card"
            tabIndex={-1}
          >
            <div className="flex items-center mb-2">
              <div className="text-lg font-semibold">Model card</div>
              <button
                className="ml-auto text-zinc-400 hover:text-zinc-200"
                onClick={() => setCardOpen(false)}
              >
                ✕
              </button>
            </div>
            <pre className="mt-3 text-xs overflow-auto max-h-[70vh] bg-zinc-900 p-3 rounded">
              {JSON.stringify(modelCard, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================
   Tiny presentational bits
========================= */
function MetricCard({ label, value, delta = null }) {
  const showDelta = delta !== null && delta !== undefined && Number.isFinite(delta);
  const up = showDelta && delta >= 0;
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 p-4 flex items-center justify-between">
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
        <div className="text-lg font-semibold">{value ?? "-"}</div>
      </div>
      {showDelta && (
        <div className={`text-sm ${up ? "text-green-400" : "text-red-400"}`}>
          {up ? "+" : ""}
          {fmt(delta)}
        </div>
      )}
    </div>
  );
}

function SupportBar({ value, total }) {
  const pct = total ? (value / total) * 100 : 0;
  return (
    <div className="inline-block align-middle">
      <div className="h-2 bg-zinc-800 rounded overflow-hidden w-40">
        <div className="h-2 bg-zinc-600" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MiniBars({ counts }) {
  const entries = Object.entries(counts || {});
  const total = entries.reduce((a, [, n]) => a + n, 0) || 1;
  const maj = entries.reduce((p, c) => (c[1] > p[1] ? c : p), entries[0] || ["N/A", 0]);

  return (
    <div className="space-y-2">
      <div className="flex gap-3 items-end">
        {entries.map(([k, v]) => (
          <div key={k} className="text-center">
            <div className="w-10 bg-zinc-700" style={{ height: `${(v / total) * 80 + 10}px` }} />
            <div className="text-xs mt-1">{k}</div>
            <div className="text-[10px] text-slate-400">{((v / total) * 100).toFixed(1)}%</div>
          </div>
        ))}
      </div>
      {maj && (
        <div className="text-xs text-slate-400">
          Majority: <span className="text-slate-200">{maj[0]}</span> ({((maj[1] / total) * 100).toFixed(1)}%)
        </div>
      )}
    </div>
  );
}

/* ===== Insights block (top-level) ===== */
function Headline({ label, value }) {
  return (
    <div className="rounded bg-white/5 border border-white/10 p-3">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function Insights({ evalRes }) {
  if (!evalRes) return null;

  const round = (x, d = 4) =>
    x === undefined || x === null || Number.isNaN(Number(x)) ? "-" : Number(x).toFixed(d);

  const cr = evalRes.classification_report || {};
  const labels = (evalRes.confusion_matrix && evalRes.confusion_matrix.labels) || [];
  const cm = (evalRes.confusion_matrix && evalRes.confusion_matrix.matrix) || [];

  const perClass = Object.entries(cr)
    .filter(
      ([k, v]) => v && typeof v === "object" && !["accuracy", "macro avg", "weighted avg"].includes(k)
    )
    .map(([name, m]) => ({
      name,
      precision: Number(m.precision ?? NaN),
      recall: Number(m.recall ?? NaN),
      f1: Number(m["f1-score"] ?? NaN),
      support: Number(m.support ?? 0),
    }));

  const byRecall = [...perClass].sort((a, b) => b.recall - a.recall);
  const weakest = byRecall.slice(-2);
  const strongest = byRecall.slice(0, 2);

  let predCounts = evalRes.prediction_counts || evalRes.counts_by_class || null;
  if (!predCounts && cm.length && labels.length === cm.length) {
    const cols = Array(labels.length).fill(0);
    for (let r = 0; r < cm.length; r++) {
      for (let c = 0; c < cm[r].length; c++) cols[c] += cm[r][c];
    }
    predCounts = Object.fromEntries(labels.map((lab, i) => [lab, cols[i]]));
  }
  const predDist = predCounts ? Object.entries(predCounts).sort((a, b) => b[1] - a[1]) : [];

  let worstPair = null;
  if (cm.length && labels.length === cm.length) {
    let max = 0,
      from = "",
      to = "";
    for (let r = 0; r < cm.length; r++) {
      for (let c = 0; c < cm[r].length; c++) {
        if (r !== c && cm[r][c] > max) {
          max = cm[r][c];
          from = labels[r];
          to = labels[c];
        }
      }
    }
    if (max > 0) worstPair = { from, to, count: max };
  }

  const bySupport = [...perClass].sort((a, b) => b.support - a.support);
  const imbalance =
    bySupport.length >= 2 && bySupport[0].support > 5 * Math.max(1, bySupport[bySupport.length - 1].support);

  const actions = [];
  if (weakest.length) {
    actions.push(
      `Improve recall for ${weakest.map((w) => w.name).join(" & ")} (target examples, augmentation, or reweighting).`
    );
  }
  if (worstPair) {
    actions.push(
      `Largest confusion: ${worstPair.from} → ${worstPair.to} (${worstPair.count}). Add features/examples to separate them.`
    );
  }
  if (predDist.length) {
    const [topLabel, topCount] = predDist[0];
    const total = predDist.reduce((s, [, n]) => s + n, 0);
    const pct = total ? (100 * topCount) / total : 0;
    if (pct > 50)
      actions.push(`Predictions skew to ${topLabel} (${pct.toFixed(1)}%). Check class balance or adjust thresholds.`);
  }
  if (imbalance) actions.push("Dataset is imbalanced (largest class >5× smallest). Consider class weights or resampling.");
  actions.push("Share the model card for context on data, metrics, and limitations.");

  return (
    <div className="mt-8 w-full max-w-4xl">
      <h3 className="text-lg font-semibold text-blue-300 mb-3">Insights & Recommendations</h3>

      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <Headline label="Rows" value={evalRes.evaluated_rows ?? evalRes.n_rows ?? "-"} />
        <Headline label="Accuracy" value={round(evalRes.accuracy)} />
        <Headline label="F1 (macro)" value={round(evalRes.macro_f1 || evalRes.f1_macro)} />
        <Headline label="Balanced Acc." value={round(evalRes.balanced_accuracy)} />
      </div>

      <div className="bg-white/5 border border-white/10 rounded p-4 mb-4">
        <div className="font-medium mb-2">Class strengths & opportunities</div>
        <div className="text-sm text-slate-200">
          <div className="mb-2">
            <span className="text-slate-400">Strongest (recall): </span>
            {strongest.map((s) => `${s.name} (R=${round(s.recall)})`).join(", ") || "-"}
          </div>
          <div>
            <span className="text-slate-400">Needs attention (recall): </span>
            {weakest.map((w) => `${w.name} (R=${round(w.recall)})`).join(", ") || "-"}
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded p-4 mb-4">
        <div className="font-medium mb-2">Error patterns & bias</div>
        <ul className="list-disc ml-5 text-sm space-y-1">
          {worstPair ? (
            <li>
              <span className="text-slate-300">Largest confusion:</span> {worstPair.from} → {worstPair.to} ({worstPair.count})
            </li>
          ) : (
            <li>No dominant confusion found.</li>
          )}
          {predDist.length ? (
            <li>
              <span className="text-slate-300">Prediction distribution:</span>{" "}
              {predDist.map(([k, v]) => `${k}: ${v}`).join(", ")}
            </li>
          ) : null}
          {imbalance && <li>Dataset is imbalanced; consider class weights or resampling.</li>}
        </ul>
      </div>

      <div className="bg-white/5 border border-white/10 rounded p-4">
        <div className="font-medium mb-2">Recommended actions</div>
        <ul className="list-disc ml-5 text-sm space-y-1">
          {actions.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}