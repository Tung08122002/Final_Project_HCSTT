from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from app.api.routes import router
from app.core.config import CORS_ORIGINS
from app.db.initialize import initialize


@asynccontextmanager
async def lifespan(app):
    initialize()
    yield


app = FastAPI(title="Laptop Advisor — Knowledge-Based System", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware, allow_origins=CORS_ORIGINS, allow_methods=["*"], allow_headers=["*"]
)
app.include_router(router)


@app.exception_handler(ValueError)
async def value_error(request: Request, exc: ValueError):
    return JSONResponse(status_code=422, content={"detail": str(exc)})


@app.exception_handler(IntegrityError)
async def integrity_error(request: Request, exc: IntegrityError):
    return JSONResponse(
        status_code=409,
        content={"detail": "Mã hoặc tên đã tồn tại, hoặc dữ liệu vi phạm ràng buộc."},
    )
