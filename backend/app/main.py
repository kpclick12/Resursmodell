from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import create_tables
from app.routes import auth, upload, calculate, plans


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await create_tables()
    yield


app = FastAPI(title="Resursmodell API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(calculate.router)
app.include_router(plans.router)
