import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Loader2 } from "lucide-react";
import { fetchLeaderboard } from "../lib/api";

export default function Leaderboard({ open, onClose }) {
  const [filter, setFilter] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchLeaderboard(filter || undefined)
      .then(setRows)
      .finally(() => setLoading(false));
  }, [open, filter]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          data-testid="leaderboard-modal"
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="relative bg-surface border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Trophy className="text-amber-400" size={22} />
                <h2 className="text-xl font-bold tracking-tight">Global Leaderboard</h2>
              </div>
              <button onClick={onClose} className="text-zinc-400 hover:text-white p-1" data-testid="close-leaderboard-btn">
                <X size={22} />
              </button>
            </div>

            <div className="flex gap-1 p-4 border-b border-white/10">
              {[
                { id: "", label: "All" },
                { id: "time", label: "Time" },
                { id: "words", label: "Words" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
                    filter === f.id ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                  data-testid={`lb-filter-${f.id || "all"}`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="flex justify-center py-16 text-zinc-500">
                  <Loader2 className="animate-spin" />
                </div>
              ) : rows.length === 0 ? (
                <div className="text-center py-16 text-zinc-500">No scores yet. Be the first!</div>
              ) : (
                <table className="w-full text-sm" data-testid="leaderboard-table">
                  <thead className="text-[10px] tracking-[0.2em] uppercase text-zinc-500">
                    <tr className="border-b border-white/5">
                      <th className="text-left py-3 px-6">#</th>
                      <th className="text-left py-3 px-2">Name</th>
                      <th className="text-right py-3 px-2">WPM</th>
                      <th className="text-right py-3 px-2">Acc</th>
                      <th className="text-right py-3 px-6">Mode</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {rows.map((r, i) => (
                      <tr key={r.id || i} className="border-b border-white/5 hover:bg-surface-hover transition-colors">
                        <td className={`py-3 px-6 font-bold ${i < 3 ? "text-amber-400" : "text-zinc-500"}`}>{i + 1}</td>
                        <td className="py-3 px-2 font-sans font-medium">{r.name}</td>
                        <td className="py-3 px-2 text-right text-volt font-bold">{r.wpm}</td>
                        <td className="py-3 px-2 text-right text-zinc-300">{r.accuracy}%</td>
                        <td className="py-3 px-6 text-right text-zinc-500 text-xs">
                          {r.mode === "time" ? `${r.duration}s` : `${r.characters}c`} · {r.difficulty}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
