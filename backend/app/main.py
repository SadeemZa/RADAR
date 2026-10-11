from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.cases import router as cases_router
from app.database import check_database_connection


app = FastAPI(
    title="RADAR API",
    description="Cybersecurity intelligence and case knowledge API.",
    version="0.1.0",
)

# Allow the local Next.js frontend to communicate with the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

app.include_router(cases_router)


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "radar-api"}


@app.get("/health/database")
async def database_health_check() -> dict[str, str]:
    try:
        check_database_connection()
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="Database connection failed.",
        ) from exc

    return {"status": "ok", "database": "connected"}