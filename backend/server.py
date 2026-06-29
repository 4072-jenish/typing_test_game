import os
import random
from datetime import datetime, timezone
from typing import List, Optional, Annotated

from fastapi import FastAPI, APIRouter, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, BeforeValidator, ConfigDict
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from word_bank import COMMON_WORDS, ADVANCED_WORDS, QUOTES, PUNCTUATION

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Typing Arena API")
api = APIRouter(prefix="/api")


# ---------- Mongo helpers ----------
def _validate_object_id(v):
    if isinstance(v, ObjectId):
        return str(v)
    return str(v)


PyObjectId = Annotated[str, BeforeValidator(_validate_object_id)]


# ---------- Models ----------
class ScoreCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=24)
    wpm: int = Field(..., ge=0, le=400)
    raw_wpm: int = Field(0, ge=0, le=500)
    accuracy: float = Field(..., ge=0, le=100)
    consistency: float = Field(0, ge=0, le=100)
    mode: str
    duration: int = 0
    difficulty: str = "medium"
    characters: int = 0


class Score(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    name: str
    wpm: int
    raw_wpm: int = 0
    accuracy: float
    consistency: float = 0
    mode: str
    duration: int = 0
    difficulty: str = "medium"
    characters: int = 0
    created_at: str


# ---------- Text generation ----------
def _capitalize_some(words: List[str], rate: float = 0.18) -> List[str]:
    out = []
    cap_next = True
    for w in words:
        if cap_next or random.random() < rate:
            w = w[0].upper() + w[1:]
        out.append(w)
        cap_next = False
    return out


def _add_punctuation(words: List[str]) -> List[str]:
    out = []
    n = len(words)
    cap_next = True
    for i, w in enumerate(words):
        if cap_next:
            w = w[0].upper() + w[1:]
            cap_next = False
        r = random.random()
        if i < n - 1 and r < 0.10:
            w = w + random.choice([",", ";", ":"])
        elif i < n - 1 and r < 0.18:
            w = w + random.choice([".", "!", "?"])
            cap_next = True
        out.append(w)
    # ensure it ends with a period
    if not out[-1][-1] in ".!?":
        out[-1] = out[-1] + "."
    return out


def _add_numbers(words: List[str], rate: float = 0.15) -> List[str]:
    out = []
    for w in words:
        if random.random() < rate:
            out.append(str(random.randint(0, 9999)))
        out.append(w)
    return out


def generate_words(count: int, difficulty: str) -> str:
    if difficulty == "easy":
        pool = COMMON_WORDS[:400]
        words = [random.choice(pool) for _ in range(count)]
        return " ".join(words)

    if difficulty == "medium":
        words = [random.choice(COMMON_WORDS) for _ in range(count)]
        words = _capitalize_some(words, rate=0.0)
        return " ".join(words)

    if difficulty == "hard":
        words = []
        for _ in range(count):
            if random.random() < 0.35:
                words.append(random.choice(ADVANCED_WORDS))
            else:
                words.append(random.choice(COMMON_WORDS))
        words = _add_numbers(words, rate=0.12)
        words = _add_punctuation(words)
        return " ".join(words)

    if difficulty == "punctuation":
        words = [random.choice(COMMON_WORDS) for _ in range(count)]
        words = _add_punctuation(words)
        return " ".join(words)

    if difficulty == "numbers":
        words = [random.choice(COMMON_WORDS) for _ in range(count)]
        words = _add_numbers(words, rate=0.4)
        return " ".join(words)

    words = [random.choice(COMMON_WORDS) for _ in range(count)]
    return " ".join(words)


# ---------- Routes ----------
@api.get("/")
async def root():
    return {"status": "ok", "service": "Typing Arena API"}


@api.get("/text")
async def get_text(
    source: str = Query("words", pattern="^(words|quote)$"),
    difficulty: str = Query("medium"),
    count: int = Query(50, ge=5, le=300),
):
    if source == "quote":
        q = random.choice(QUOTES)
        return {
            "source": "quote",
            "text": q["text"],
            "author": q["author"],
            "difficulty": difficulty,
        }
    text = generate_words(count, difficulty)
    return {"source": "words", "text": text, "author": None, "difficulty": difficulty}


@api.post("/scores", response_model=Score)
async def create_score(payload: ScoreCreate):
    doc = payload.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    res = await db.scores.insert_one(doc)
    doc["_id"] = res.inserted_id
    return Score(**doc)


@api.get("/leaderboard", response_model=List[Score])
async def leaderboard(
    mode: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
):
    query = {}
    if mode:
        query["mode"] = mode
    cursor = db.scores.find(query).sort("wpm", -1).limit(limit)
    out = []
    async for doc in cursor:
        out.append(Score(**doc))
    return out


@api.get("/stats")
async def global_stats():
    total = await db.scores.count_documents({})
    pipeline = [
        {"$group": {"_id": None, "avg_wpm": {"$avg": "$wpm"}, "best_wpm": {"$max": "$wpm"}}}
    ]
    agg = await db.scores.aggregate(pipeline).to_list(length=1)
    avg_wpm = round(agg[0]["avg_wpm"], 1) if agg else 0
    best_wpm = agg[0]["best_wpm"] if agg else 0
    return {"total_races": total, "avg_wpm": avg_wpm, "best_wpm": best_wpm}


app.include_router(api)

CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown():
    client.close()
