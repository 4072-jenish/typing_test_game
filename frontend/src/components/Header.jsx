import React from "react";
import { Keyboard, Trophy } from "lucide-react";

export default function Header({ onOpenLeaderboard, globalStats }) {
  return (
    <header className="flex items-center justify-between w-full" data-testid="app-header">
      <div className="flex items-center gap-3">
        <div className="relative grid place-items-center w-11 h-11 rounded-xl bg-volt/10 border border-volt/30">
          <Keyboard className="text-volt" size={22} />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <div className="leading-none">
          <h1 className="text-2xl font-black tracking-tight">
            Typing<span className="text-volt">Arena</span>
          </h1>
          <p className="text-[11px] tracking-[0.25em] uppercase text-zinc-500 mt-1">
            Dynamic Speed Test
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {globalStats && (
          <div className="hidden md:flex items-center gap-5 text-right">
            <Metric label="races" value={globalStats.total_races} />
            <Metric label="avg wpm" value={globalStats.avg_wpm} />
            <Metric label="best" value={globalStats.best_wpm} />
          </div>
        )}
        <button
          onClick={onOpenLeaderboard}
          data-testid="open-leaderboard-btn"
          className="inline-flex items-center gap-2 text-zinc-300 hover:text-white hover:bg-zinc-800 py-2 px-4 rounded-lg transition-colors border border-white/5"
        >
          <Trophy size={16} className="text-amber-400" />
          <span className="text-sm font-medium">Leaderboard</span>
        </button>
      </div>
    </header>
  );
}

const Metric = ({ label, value }) => (
  <div>
    <div className="font-mono font-bold text-lg leading-none">{value}</div>
    <div className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mt-1">{label}</div>
  </div>
);
