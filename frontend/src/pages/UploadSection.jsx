import { useParams } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../lib/api";

export default function UploadSection() {
  const { missionName } = useParams();
  const mission = missionName?.toUpperCase();

  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [res, setRes] = useState(null);
  const [shake, setShake] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] ?? null);
    setError("");
    setRes(null);
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please choose a CSV file.");
      setShake(true);
      setTimeout(() => setShake(false), 450);
      return;
    }

    setBusy(true);
    setError("");
    setRes(null);
    try {
      const r = await api.evaluate(file);  // ← straight to /evaluate
      setRes(r);
    } catch (e) {
      setError(e.message || "Request failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center pt-40 pb-16 px-6 text-white bg-gradient-to-b from-black via-gray-900 to-black">
      <h1 className="text-4xl font-bold text-blue-400 mb-2">Evaluate {mission}</h1>
      <p className="text-gray-300 mb-8 text-center max-w-xl">
        Upload a KOI CSV that includes the label column <b>koi_pdisposition</b>.
      </p>

      <motion.div
        className="flex flex-col items-center mb-6"
        animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.35 }}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="border-2 border-blue-400 px-4 py-2 rounded-md bg-gray-800 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <AnimatePresence>
          {error && (
            <motion.p
              className="text-red-500 text-sm mt-2 font-medium"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      <button
        onClick={handleAnalyze}
        disabled={busy || !file}
        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md font-semibold shadow-lg disabled:opacity-50"
      >
        {busy ? "Evaluating..." : "Evaluate"}
      </button>

      {res && (
        <div className="mt-10 w-full max-w-4xl space-y-6">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Evaluated rows" value={res.evaluated_rows} />
            <Stat label="Accuracy" value={Number(res.accuracy).toFixed(4)} />
            <Stat label="Macro F1" value={Number(res.macro_f1).toFixed(4)} />
            <Stat label="Balanced Acc." value={Number(res.balanced_accuracy).toFixed(4)} />
          </div>

          {/* Confusion matrix */}
          {res.confusion_matrix?.matrix && (
            <div className="bg-white/5 border border-white/10 rounded p-4">
              <h3 className="font-semibold mb-2">Confusion Matrix</h3>
              <table className="text-sm border-collapse">
                <tbody>
                  {res.confusion_matrix.matrix.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((v, ci) => (
                        <td key={ci} className="px-3 py-2 border border-white/10">{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {res.class_names && (
                <div className="text-xs mt-2 text-slate-300">
                  Labels: {res.class_names.join(" , ")}
                </div>
              )}
            </div>
          )}

          {/* Per-class metrics */}
          {res.classification_report && (
            <div className="bg-white/5 border border-white/10 rounded p-4 overflow-auto">
              <h3 className="font-semibold mb-2">Per-class metrics</h3>
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
                  {Object.entries(res.classification_report)
                    .filter(([k]) => !["accuracy", "macro avg", "weighted avg"].includes(k))
                    .map(([cls, m]) => (
                      <tr key={cls} className="border-b border-white/5">
                        <td className="py-2">{cls}</td>
                        <td className="py-2">{Number(m.precision).toFixed(4)}</td>
                        <td className="py-2">{Number(m.recall).toFixed(4)}</td>
                        <td className="py-2">{Number(m["f1-score"]).toFixed(4)}</td>
                        <td className="py-2">{m.support}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}