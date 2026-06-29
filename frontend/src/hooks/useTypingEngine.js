import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// Computes stats and manages keystroke state for a typing test.
export default function useTypingEngine({ text, mode, timeLimit, onFinish }) {
  const [typed, setTyped] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [finished, setFinished] = useState(false);
  const [errorIndex, setErrorIndex] = useState(-1); // for shake on wrong char
  const wpmHistory = useRef([]); // [{t, wpm, raw, errors}]
  const lastSampleSec = useRef(0);
  const errorsRef = useRef(0); // cumulative wrong keystrokes

  const reset = useCallback(() => {
    setTyped("");
    setStartTime(null);
    setElapsed(0);
    setFinished(false);
    setErrorIndex(-1);
    wpmHistory.current = [];
    lastSampleSec.current = 0;
    errorsRef.current = 0;
  }, []);

  // reset when text changes
  useEffect(() => {
    reset();
  }, [text, reset]);

  const computeStats = useCallback(
    (typedStr, seconds) => {
      let correct = 0;
      let incorrect = 0;
      for (let i = 0; i < typedStr.length; i++) {
        if (typedStr[i] === text[i]) correct++;
        else incorrect++;
      }
      const minutes = seconds > 0 ? seconds / 60 : 1 / 60;
      const wpm = Math.round(correct / 5 / minutes);
      const raw = Math.round(typedStr.length / 5 / minutes);
      const accuracy =
        typedStr.length > 0
          ? Math.round((correct / typedStr.length) * 1000) / 10
          : 100;
      return { correct, incorrect, wpm: wpm || 0, raw: raw || 0, accuracy };
    },
    [text]
  );

  const finish = useCallback(() => {
    setFinished(true);
    const seconds = startTime ? (Date.now() - startTime) / 1000 : elapsed;
    const stats = computeStats(typed, seconds);
    // consistency: based on coefficient of variation of wpm samples
    const samples = wpmHistory.current.map((s) => s.wpm).filter((v) => v > 0);
    let consistency = 100;
    if (samples.length > 1) {
      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      const variance =
        samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length;
      const std = Math.sqrt(variance);
      consistency = Math.max(0, Math.round((1 - std / (mean || 1)) * 100));
    }
    onFinish?.({
      ...stats,
      consistency,
      duration: Math.round(seconds),
      characters: typed.length,
      history: wpmHistory.current,
    });
  }, [startTime, elapsed, computeStats, typed, onFinish]);

  // Timer
  useEffect(() => {
    if (!startTime || finished) return;
    const id = setInterval(() => {
      const secs = (Date.now() - startTime) / 1000;
      setElapsed(secs);
      const sec = Math.floor(secs);
      if (sec > lastSampleSec.current) {
        lastSampleSec.current = sec;
        const s = computeStats(typedRef.current, secs);
        wpmHistory.current.push({
          t: sec,
          wpm: s.wpm,
          raw: s.raw,
          errors: errorsRef.current,
        });
      }
      if (mode === "time" && secs >= timeLimit) {
        clearInterval(id);
        finish();
      }
    }, 100);
    return () => clearInterval(id);
  }, [startTime, finished, mode, timeLimit, computeStats, finish]);

  // keep a ref of typed for the interval sampler
  const typedRef = useRef("");
  useEffect(() => {
    typedRef.current = typed;
  }, [typed]);

  const handleKey = useCallback(
    (e) => {
      if (finished) return;
      const { key } = e;

      // start on first valid key
      if (!startTime && (key.length === 1 || key === "Backspace")) {
        if (key !== "Backspace") setStartTime(Date.now());
      }

      if (key === "Backspace") {
        e.preventDefault();
        setTyped((prev) => prev.slice(0, -1));
        return;
      }

      if (key.length === 1) {
        e.preventDefault();
        setTyped((prev) => {
          if (prev.length >= text.length) return prev;
          const next = prev + key;
          const idx = next.length - 1;
          if (next[idx] !== text[idx]) {
            errorsRef.current += 1;
            setErrorIndex(idx);
            setTimeout(() => setErrorIndex(-1), 200);
          }
          // word mode finish
          if (mode === "words" && next.length >= text.length) {
            setTimeout(() => finish(), 0);
          }
          return next;
        });
      }
    },
    [finished, startTime, text, mode, finish]
  );

  const liveStats = useMemo(() => {
    const seconds = startTime ? elapsed : 0;
    return computeStats(typed, seconds || 1 / 60);
  }, [typed, elapsed, startTime, computeStats]);

  const timeLeft =
    mode === "time" ? Math.max(0, Math.ceil(timeLimit - elapsed)) : null;
  const progress =
    mode === "words"
      ? (typed.length / Math.max(text.length, 1)) * 100
      : (elapsed / Math.max(timeLimit, 1)) * 100;

  return {
    typed,
    finished,
    started: !!startTime,
    elapsed,
    timeLeft,
    progress,
    errorIndex,
    liveStats,
    handleKey,
    reset,
    finish,
  };
}
