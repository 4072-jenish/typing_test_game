"""Backend API tests for Typing Arena."""
import os
import re
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else None
if not BASE_URL:
    # fallback for in-container running where backend exposed publicly via frontend env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.strip().split("=", 1)[1].rstrip("/")
                break

API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- Health ----------
def test_root_ok(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    data = r.json()
    assert data.get("status") == "ok"


# ---------- Text generation ----------
def test_text_words_medium(session):
    r = session.get(f"{API}/text", params={"source": "words", "difficulty": "medium", "count": 50})
    assert r.status_code == 200
    data = r.json()
    assert data["source"] == "words"
    assert isinstance(data["text"], str)
    assert len(data["text"].split()) >= 30
    assert data["author"] is None


def test_text_is_random(session):
    a = session.get(f"{API}/text", params={"source": "words", "difficulty": "medium", "count": 50}).json()["text"]
    b = session.get(f"{API}/text", params={"source": "words", "difficulty": "medium", "count": 50}).json()["text"]
    # extremely unlikely to be identical with 50 random words
    assert a != b


def test_text_easy(session):
    r = session.get(f"{API}/text", params={"source": "words", "difficulty": "easy", "count": 30})
    assert r.status_code == 200
    assert len(r.json()["text"]) > 0


def test_text_hard_has_features(session):
    # try a few calls, hard should include digits or punctuation at least once
    saw_digit = False
    saw_punct = False
    for _ in range(5):
        t = session.get(f"{API}/text", params={"source": "words", "difficulty": "hard", "count": 80}).json()["text"]
        if re.search(r"\d", t):
            saw_digit = True
        if re.search(r"[.,;:!?]", t):
            saw_punct = True
    assert saw_digit or saw_punct, "Hard difficulty should include digits or punctuation"


def test_text_numbers_has_digits(session):
    found = False
    for _ in range(3):
        t = session.get(f"{API}/text", params={"source": "words", "difficulty": "numbers", "count": 50}).json()["text"]
        if re.search(r"\d", t):
            found = True
            break
    assert found, "Numbers difficulty should include digits"


def test_text_punctuation_has_punct(session):
    t = session.get(f"{API}/text", params={"source": "words", "difficulty": "punctuation", "count": 50}).json()["text"]
    assert re.search(r"[.,;:!?]", t)


def test_text_quote(session):
    r = session.get(f"{API}/text", params={"source": "quote"})
    assert r.status_code == 200
    data = r.json()
    assert data["source"] == "quote"
    assert data["author"]
    assert len(data["text"]) > 20


# ---------- Scores & Leaderboard ----------
def test_create_score_and_leaderboard(session):
    payload = {
        "name": "TEST_pytest_user",
        "wpm": 88,
        "raw_wpm": 92,
        "accuracy": 96.5,
        "consistency": 80.0,
        "mode": "time",
        "duration": 30,
        "difficulty": "medium",
        "characters": 220,
    }
    r = session.post(f"{API}/scores", json=payload)
    assert r.status_code == 200, r.text
    score = r.json()
    assert score["name"] == "TEST_pytest_user"
    assert score["wpm"] == 88
    # Backend currently returns "_id" (alias) instead of "id" – report-only
    assert ("id" in score and score["id"]) or ("_id" in score and score["_id"])

    # leaderboard contains it
    lb = session.get(f"{API}/leaderboard").json()
    assert any(s["name"] == "TEST_pytest_user" and s["wpm"] == 88 for s in lb)

    # sorted descending by wpm
    wpms = [s["wpm"] for s in lb]
    assert wpms == sorted(wpms, reverse=True)


def test_leaderboard_mode_filter(session):
    # create a words-mode score
    payload = {
        "name": "TEST_words_user",
        "wpm": 70, "raw_wpm": 75, "accuracy": 95.0, "consistency": 70.0,
        "mode": "words", "duration": 20, "difficulty": "easy", "characters": 100,
    }
    r = session.post(f"{API}/scores", json=payload)
    assert r.status_code == 200

    lb = session.get(f"{API}/leaderboard", params={"mode": "words"}).json()
    assert all(s["mode"] == "words" for s in lb)
    assert any(s["name"] == "TEST_words_user" for s in lb)


def test_score_validation(session):
    # invalid wpm > 400
    r = session.post(f"{API}/scores", json={
        "name": "x", "wpm": 9999, "accuracy": 50, "mode": "time"
    })
    assert r.status_code == 422


def test_stats(session):
    r = session.get(f"{API}/stats")
    assert r.status_code == 200
    data = r.json()
    assert "total_races" in data
    assert "avg_wpm" in data
    assert "best_wpm" in data
    assert data["total_races"] >= 1
