import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  CartesianGrid,
} from "recharts";
import { RotateCcw, ArrowRight, Crown, Check, Loader2 } from "lucide-react";

const card =
  "border border-white/10 bg-surface rounded-xl relative overflow-hidden";

export default function Results({ result, config, onRestart, onNext, onSave, isPB }) {
  const [name, setName] = useState(localStorage.getItem("ta_name") || "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    localStorage.setItem("ta_name", name.trim());
    await onSave(name.trim());
    setSaving(false);
    setSaved(true);
  };

  const chartData = (result.history || []).map((h) => ({
    t: h.t,
    wpm: h.wpm,
    raw: h.raw,
  }));

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const modeLabel =
    config.source === "quote"
      ? "quote"
      : config.mode === "time"
      ? `${config.value}s · ${config.difficulty}`
      : `${config.value} words · ${config.difficulty}`;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="w-full max-w-5xl mx-auto"
      data-testid="results-screen"
    >
      <motion.div variants={item} className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[11px] tracking-[0.25em] uppercase text-zinc-500">Test Complete</p>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">{modeLabel}</h2>
        </div>
        {isPB && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-2 bg-amber-400/15 border border-amber-400/40 text-amber-300 px-4 py-2 rounded-full"
            data-testid="pb-badge"
          >
            <Crown size={16} /> New Personal Best!
          </motion.div>
        )}
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div variants={item} className={`${card} col-span-2 md:col-span-2 md:row-span-2 p-8 flex flex-col justify-center items-center`}>
          <div className="absolute inset-0 bg-gradient-to-br from-volt/10 to-transparent pointer-events-none" />
          <p className="text-[11px] tracking-[0.25em] uppercase text-zinc-500">Words / Min</p>
          <div className="font-mono font-black text-7xl md:text-8xl tracking-tighter text-volt my-2" data-testid="result-wpm">
            {result.wpm}
          </div>
          <p className="text-zinc-500 text-sm font-mono">raw {result.raw} wpm</p>
        </motion.div>

        <StatBox v={item} label="accuracy" value={`${result.accuracy}%`} testid="result-accuracy" />
        <StatBox v={item} label="consistency" value={`${result.consistency}%`} testid="result-consistency" />
        <StatBox v={item} label="characters" value={result.characters} testid="result-characters" sub={`${result.correct} correct · ${result.incorrect} wrong`} />
        <StatBox v={item} label="time" value={`${result.duration}s`} testid="result-time" />
      </div>

      {chartData.length > 1 && (
        <motion.div variants={item} className={`${card} p-6 h-64 mt-4`} data-testid="result-chart">
          <p className="text-[11px] tracking-[0.25em] uppercase text-zinc-500 mb-3">WPM over time</p>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="wpmFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#007AFF" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#007AFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="t" stroke="#52525B" fontSize={11} tickLine={false} unit="s" />
              <YAxis stroke="#52525B" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "#121212",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  fontFamily: "JetBrains Mono",
                  fontSize: 12,
                }}
                labelStyle={{ color: "#A1A1AA" }}
              />
              <Area type="monotone" dataKey="raw" stroke="#3F3F46" strokeWidth={1.5} fill="transparent" dot={false} />
              <Area type="monotone" dataKey="wpm" stroke="#007AFF" strokeWidth={2.5} fill="url(#wpmFill)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      <motion.div variants={item} className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
        <div className="flex items-center gap-2">
          {!saved ? (
            <>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                maxLength={24}
                placeholder="Enter name to save score"
                className="bg-surface border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-volt focus:ring-2 focus:ring-volt/30 font-mono w-56"
                data-testid="name-input"
              />
              <button
                onClick={handleSave}
                disabled={!name.trim() || saving}
                className="inline-flex items-center gap-2 bg-volt text-white font-bold py-2.5 px-5 rounded-lg hover:bg-volt-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                data-testid="save-score-btn"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Crown size={16} />}
                Save to Leaderboard
              </button>
            </>
          ) : (
            <span className="inline-flex items-center gap-2 text-emerald-400 font-medium" data-testid="saved-confirm">
              <Check size={18} /> Score saved!
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRestart}
            className="inline-flex items-center gap-2 text-zinc-300 hover:text-white hover:bg-zinc-800 py-2.5 px-5 rounded-lg transition-colors border border-white/5"
            data-testid="restart-btn"
          >
            <RotateCcw size={16} /> Restart
          </button>
          <button
            onClick={onNext}
            className="inline-flex items-center gap-2 bg-white text-black font-bold py-2.5 px-5 rounded-lg hover:bg-zinc-200 transition-colors"
            data-testid="next-test-btn"
          >
            Next Test <ArrowRight size={16} />
          </button>
        </div>
      </motion.div>

      <p className="text-center text-zinc-600 text-xs mt-6 font-mono">
        press <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">Tab</kbd> +{" "}
        <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">Enter</kbd> for next test
      </p>
    </motion.div>
  );
}

const StatBox = ({ v, label, value, sub, testid }) => (
  <motion.div variants={v} className={`${card} p-6 flex flex-col justify-between`} data-testid={testid}>
    <p className="text-[11px] tracking-[0.2em] uppercase text-zinc-500">{label}</p>
    <div className="font-mono font-bold text-3xl mt-3">{value}</div>
    {sub && <p className="text-zinc-600 text-xs mt-1 font-mono">{sub}</p>}
  </motion.div>
);
