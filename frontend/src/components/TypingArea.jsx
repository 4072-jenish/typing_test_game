import React, { useRef, useLayoutEffect, useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function TypingArea({
  text,
  typed,
  finished,
  errorIndex,
  onKey,
  focused,
  setFocused,
}) {
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const charRefs = useRef([]);
  const [caret, setCaret] = useState({ left: 0, top: 0, height: 36 });
  const [offset, setOffset] = useState(0);

  const chars = text.split("");
  const currentIndex = typed.length;

  // keep hidden input focused
  useEffect(() => {
    if (focused && inputRef.current) inputRef.current.focus();
  }, [focused, text]);

  useLayoutEffect(() => {
    const idx = Math.min(currentIndex, chars.length - 1);
    const el = charRefs.current[idx];
    if (!el || !containerRef.current) return;
    const atEnd = currentIndex >= chars.length;
    const left = atEnd ? el.offsetLeft + el.offsetWidth : el.offsetLeft;
    const top = el.offsetTop;
    const height = el.offsetHeight;
    setCaret({ left, top, height });
    // scroll: keep caret line near the top third (one line of context above)
    const lineH = height;
    const desired = Math.max(0, top - lineH);
    setOffset(desired);
  }, [currentIndex, chars.length, text]);

  return (
    <div
      className="relative w-full"
      onClick={() => {
        setFocused(true);
        inputRef.current?.focus();
      }}
      data-testid="typing-area"
    >
      <input
        ref={inputRef}
        className="capture-input"
        value=""
        onChange={() => {}}
        onKeyDown={onKey}
        onBlur={() => setFocused(false)}
        onFocus={() => setFocused(true)}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        data-testid="typing-input"
      />

      {/* blur prompt overlay */}
      {!focused && !finished && (
        <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-sm rounded-xl cursor-pointer">
          <span className="text-zinc-300 font-medium text-lg tracking-wide">
            Click here or press any key to focus
          </span>
        </div>
      )}

      <div
        ref={containerRef}
        className={`relative overflow-hidden select-none transition-[filter] ${
          !focused && !finished ? "blur-[3px]" : ""
        }`}
        style={{ height: "10.8rem" }}
      >
        <div
          className="font-mono text-2xl md:text-3xl lg:text-4xl leading-[3.6rem] tracking-wide transition-transform duration-150 ease-out"
          style={{ transform: `translateY(-${offset}px)` }}
        >
          {/* caret */}
          <motion.span
            className="absolute w-[3px] rounded-full bg-volt z-10"
            animate={{
              left: caret.left,
              top: caret.top + 6,
              opacity: 1,
            }}
            transition={{ duration: 0.08, ease: "easeOut" }}
            style={{
              height: caret.height - 12,
              boxShadow: "0 0 8px rgba(0,122,255,0.8)",
            }}
            data-testid="caret"
          />
          {chars.map((ch, i) => {
            let cls = "text-zinc-600";
            if (i < typed.length) {
              cls =
                typed[i] === ch
                  ? "text-zinc-100"
                  : ch === " "
                  ? "text-red-500 bg-red-500/30 rounded"
                  : "text-red-500 bg-red-500/20 rounded-sm";
            }
            const shake = i === errorIndex ? "inline-block animate-shake" : "";
            return (
              <span
                key={i}
                ref={(el) => (charRefs.current[i] = el)}
                className={`${cls} ${shake}`}
              >
                {ch}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
