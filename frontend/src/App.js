import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { RotateCcw, RefreshCw, Loader2 } from "lucide-react";
import "./App.css";

import Header from "./components/Header";
import ConfigBar from "./components/ConfigBar";
import TypingArea from "./components/TypingArea";
import StatsHud from "./components/StatsHud";
import Results from "./components/Results";
import Leaderboard from "./components/Leaderboard";
import useTypingEngine from "./hooks/useTypingEngine";
import { fetchText, submitScore, fetchGlobalStats } from "./lib/api";

const DEFAULT_CONFIG = { source: "words", difficulty: "medium", mode: "time", value: 30 };

function App() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [text, setText] = useState("");
  const [quoteAuthor, setQuoteAuthor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState("test"); // test | results
  const [result, setResult] = useState(null);
  const [isPB, setIsPB] = useState(false);
  const [focused, setFocused] = useState(false);
  const [lbOpen, setLbOpen] = useState(false);
  const [globalStats, setGlobalStats] = useState(null);

  const countFor = useCallback((cfg) => {
    if (cfg.mode === "words") return cfg.value;
    return Math.min(300, cfg.value * 5);
  }, []);

  const loadText = useCallback(
    async (cfg) => {
      setLoading(true);
      try {
        const data = await fetchText({
          source: cfg.source,
          difficulty: cfg.difficulty,
          count: countFor(cfg),
        });
        setText(data.text);
        setQuoteAuthor(data.author);
      } catch (e) {
        setText("the quick brown fox jumps over the lazy dog while we wait for the server to wake up again");
        setQuoteAuthor(null);
      } finally {
        setLoading(false);
      }
    },
    [countFor]
  );

  // reload when config changes
  useEffect(() => {
    setScreen("test");
    loadText(config);
  }, [config, loadText]);

  useEffect(() => {
    fetchGlobalStats().then(setGlobalStats).catch(() => {});
  }, []);

  const onFinish = useCallback(
    (res) => {
      setResult(res);
      setScreen("results");
      const pbKey = `ta_pb_${config.source}`;
      const prevPB = Number(localStorage.getItem(pbKey) || 0);
      const beat = res.wpm > prevPB && res.accuracy >= 75;
      if (res.wpm > prevPB) localStorage.setItem(pbKey, String(res.wpm));
      setIsPB(beat && prevPB > 0);
      if (beat && prevPB > 0) {
        confetti({
          particleCount: 140,
          spread: 80,
          origin: { y: 0.5 },
          colors: ["#007AFF", "#FFFFFF", "#FFD700", "#3B82F6"],
        });
      }
    },
    [config.source]
  );

  const engine = useTypingEngine({
    text,
    mode: config.source === "quote" ? "words" : config.mode,
    timeLimit: config.value,
    onFinish,
  });

  const handleRestart = useCallback(() => {
    setScreen("test");
    setResult(null);
    engine.reset();
    setFocused(true);
  }, [engine]);

  const handleNext = useCallback(() => {
    setScreen("test");
    setResult(null);
    setFocused(true);
    loadText(config);
  }, [config, loadText]);

  // global shortcuts
  const tabRef = useRef(false);
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        tabRef.current = true;
        setTimeout(() => (tabRef.current = false), 600);
        return;
      }
      if (e.key === "Enter" && tabRef.current) {
        e.preventDefault();
        handleNext();
      }
      if (e.key === "Escape" && lbOpen) setLbOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleNext, lbOpen]);

  const saveScore = useCallback(
    async (name) => {
      if (!result) return false;
      try {
        await submitScore({
          name,
          wpm: result.wpm,
          raw_wpm: result.raw,
          accuracy: result.accuracy,
          consistency: result.consistency,
          mode: config.source === "quote" ? "quote" : config.mode,
          duration: result.duration,
          difficulty: config.source === "quote" ? "quote" : config.difficulty,
          characters: result.characters,
        });
        fetchGlobalStats().then(setGlobalStats).catch(() => {});
        return true;
      } catch (e) {
        return false;
      }
    },
    [result, config]
  );

  const activeMode = config.source === "quote" ? "words" : config.mode;

  return (
    <div className="relative min-h-screen flex flex-col">
      <div className="app-backdrop" />
      <div className="grid-overlay" />

      <div className="relative z-10 flex-1 flex flex-col max-w-6xl w-full mx-auto px-5 md:px-8 py-6 md:py-8">
        <Header onOpenLeaderboard={() => setLbOpen(true)} globalStats={globalStats} />

        <main className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {screen === "test" ? (
              <motion.div
                key="test"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35 }}
                className="flex flex-col gap-10"
              >
                <div className="flex justify-center">
                  <ConfigBar config={config} setConfig={setConfig} disabled={engine.started} />
                </div>

                <StatsHud
                  mode={activeMode}
                  timeLeft={engine.timeLeft}
                  liveStats={engine.liveStats}
                  progress={engine.progress}
                  started={engine.started}
                />

                <div className="relative">
                  {loading ? (
                    <div className="h-[10.8rem] flex items-center justify-center text-zinc-600">
                      <Loader2 className="animate-spin" />
                    </div>
                  ) : (
                    <TypingArea
                      text={text}
                      typed={engine.typed}
                      finished={engine.finished}
                      errorIndex={engine.errorIndex}
                      onKey={engine.handleKey}
                      focused={focused}
                      setFocused={setFocused}
                    />
                  )}
                  {quoteAuthor && (
                    <p className="text-right text-zinc-500 font-medium mt-4 mr-2">— {quoteAuthor}</p>
                  )}
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={handleRestart}
                    className="inline-flex items-center gap-2 text-zinc-400 hover:text-white hover:bg-zinc-800 py-2.5 px-5 rounded-lg transition-colors border border-white/5"
                    data-testid="reset-btn"
                  >
                    <RotateCcw size={16} /> Restart
                  </button>
                  <button
                    onClick={handleNext}
                    className="inline-flex items-center gap-2 text-zinc-400 hover:text-white hover:bg-zinc-800 py-2.5 px-5 rounded-lg transition-colors border border-white/5"
                    data-testid="new-text-btn"
                  >
                    <RefreshCw size={16} /> New Text
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Results
                  result={result}
                  config={config}
                  onRestart={handleRestart}
                  onNext={handleNext}
                  onSave={saveScore}
                  isPB={isPB}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="text-center text-zinc-700 text-xs font-mono pt-8">
          TypingArena · dynamically generated text · keep your hands relaxed
        </footer>
      </div>

      <Leaderboard open={lbOpen} onClose={() => setLbOpen(false)} />
    </div>
  );
}

export default App;
