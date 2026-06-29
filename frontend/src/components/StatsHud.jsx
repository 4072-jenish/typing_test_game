import React from "react";
import { motion } from "framer-motion";

export default function StatsHud({ mode, timeLeft, liveStats, progress, started }) {
  return (
    <motion.div
      className="flex items-center justify-center gap-8 md:gap-12"
      animate={{ opacity: started ? 0.55 : 1 }}
      transition={{ duration: 0.3 }}
      data-testid="stats-hud"
    >
      {mode === "time" ? (
        <Stat label="time" value={`${timeLeft}s`} highlight testid="hud-time" />
      ) : (
        <Stat label="progress" value={`${Math.round(progress)}%`} highlight testid="hud-progress" />
      )}
      <Stat label="wpm" value={liveStats.wpm} testid="hud-wpm" />
      <Stat label="acc" value={`${liveStats.accuracy}%`} testid="hud-acc" />
    </motion.div>
  );
}

const Stat = ({ label, value, highlight, testid }) => (
  <div className="text-center" data-testid={testid}>
    <div
      className={`font-mono font-bold text-2xl md:text-3xl tracking-tight ${
        highlight ? "text-volt" : "text-white"
      }`}
    >
      {value}
    </div>
    <div className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mt-1">{label}</div>
  </div>
);
