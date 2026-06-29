# TypingArena — Product Requirements

## Original Problem Statement
User had a single static `index.html` typing game with only 4 hardcoded sample texts and a
"boring" purple/pink gradient UI. They asked to scale it up, make the text to type **dynamic
and random**, and build a "perfect UI" for the typing game.

## Solution / Architecture
Rebuilt the static HTML into a full-stack app:
- **Backend**: FastAPI + MongoDB (Motor). Dynamic server-side text generation + leaderboard.
- **Frontend**: React (CRA) + Tailwind + Framer Motion + Recharts + lucide-react.
- **Theme**: Dark "Performance Pro" — Obsidian #0A0A0A, Volt Blue #007AFF, Outfit (UI) + JetBrains Mono (typing).

## Core Requirements (static)
- Dynamically generated random typing text (never the same twice).
- Multiple difficulties: easy, medium, hard, punctuation, numbers.
- Quote mode (curated quotes w/ author).
- Time mode (15/30/60/120s) and Word-count mode (10/25/50/100).
- Live HUD: WPM, accuracy, time/progress.
- Results: WPM, raw WPM, accuracy, consistency, characters, time, WPM-over-time chart, confetti on PB.
- Global leaderboard (MongoDB) + local personal best (localStorage).

## What's Implemented (2026-06-29)
- Backend endpoints: `GET /api/`, `GET /api/text`, `POST /api/scores`, `GET /api/leaderboard`, `GET /api/stats`.
- `word_bank.py`: ~300 common words, ~75 advanced words, 20 quotes. Generators apply
  capitalization, punctuation and number injection per difficulty.
- Frontend: full typing engine (`useTypingEngine.js`) with hidden-input keystroke capture,
  animated caret tracking, per-char correct/incorrect highlighting, line scrolling.
- Config bar, Stats HUD, bento Results screen + Recharts chart, Leaderboard modal, save-score flow.
- Keyboard shortcut Tab+Enter -> next test.
- Tested: backend 12/12 pytest pass; frontend e2e flows verified. Fixed save-confirm-on-error bug,
  `_id`->`id` response, raised WPM cap to 600, reduced hard-mode number spam.

## Backlog / Next
- P1: Word-level error tracking + "stop on error" option; live caret smoothing for very long texts.
- P1: User accounts so leaderboard/PB persist per user (currently anonymous + localStorage).
- P2: AI-generated passages mode (LLM) by topic/difficulty.
- P2: Themes selector (multiple color schemes), sound/keystroke audio feedback.
- P2: Daily challenge + shareable result cards.
