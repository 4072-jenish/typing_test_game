import React from "react";
import { Clock, Type, Quote, AtSign, Hash, Zap, Gauge, Feather } from "lucide-react";

const Pill = ({ active, onClick, children, testid }) => (
  <button
    onClick={onClick}
    data-testid={testid}
    className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
      active
        ? "bg-zinc-800 text-white shadow-sm"
        : "text-zinc-500 hover:text-zinc-300"
    }`}
  >
    {children}
  </button>
);

const Group = ({ children }) => (
  <div className="bg-zinc-900/80 rounded-full p-1 inline-flex items-center gap-1 border border-white/5">
    {children}
  </div>
);

const Sep = () => <div className="w-px h-5 bg-white/10 mx-1" />;

const DIFFICULTIES = [
  { id: "easy", label: "easy", icon: Feather },
  { id: "medium", label: "medium", icon: Gauge },
  { id: "hard", label: "hard", icon: Zap },
  { id: "punctuation", label: "punctuation", icon: AtSign },
  { id: "numbers", label: "numbers", icon: Hash },
];

const TIME_OPTS = [15, 30, 60, 120];
const WORD_OPTS = [10, 25, 50, 100];

export default function ConfigBar({ config, setConfig, disabled }) {
  const { source, difficulty, mode, value } = config;
  const update = (patch) => !disabled && setConfig((c) => ({ ...c, ...patch }));

  return (
    <div className="flex flex-wrap items-center justify-center gap-3" data-testid="config-bar">
      <Group>
        <Pill active={source === "words"} onClick={() => update({ source: "words" })} testid="source-words">
          <span className="inline-flex items-center gap-1.5"><Type size={14} /> words</span>
        </Pill>
        <Pill active={source === "quote"} onClick={() => update({ source: "quote" })} testid="source-quote">
          <span className="inline-flex items-center gap-1.5"><Quote size={14} /> quote</span>
        </Pill>
      </Group>

      {source === "words" && (
        <Group>
          {DIFFICULTIES.map((d) => (
            <Pill
              key={d.id}
              active={difficulty === d.id}
              onClick={() => update({ difficulty: d.id })}
              testid={`difficulty-${d.id}`}
            >
              {d.label}
            </Pill>
          ))}
        </Group>
      )}

      {source === "words" && (
        <Group>
          <Pill active={mode === "time"} onClick={() => update({ mode: "time", value: 30 })} testid="mode-time">
            <span className="inline-flex items-center gap-1.5"><Clock size={14} /> time</span>
          </Pill>
          <Pill active={mode === "words"} onClick={() => update({ mode: "words", value: 25 })} testid="mode-words">
            words
          </Pill>
          <Sep />
          {(mode === "time" ? TIME_OPTS : WORD_OPTS).map((v) => (
            <Pill key={v} active={value === v} onClick={() => update({ value: v })} testid={`value-${v}`}>
              {v}
            </Pill>
          ))}
        </Group>
      )}
    </div>
  );
}
