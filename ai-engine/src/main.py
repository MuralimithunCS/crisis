from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from .routes import analyze, simulate, chat, survival, flood

app = FastAPI(title="CrisisIQ AI Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health() -> dict:
    mode = "demo" if os.getenv("USE_MOCK_LLM", "false").lower() == "true" else "live"
    return {"status": "ok", "mode": mode}

@app.get("/ready")
async def ready() -> dict:
    return {"ready": True}

# Include routers
app.include_router(analyze.router)
app.include_router(simulate.router)
app.include_router(chat.router)
app.include_router(survival.router)
app.include_router(flood.router)
