from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from router import plate
from router import words

app = FastAPI()

# IMPORTANT: Allow your React dev server to talk to this API
origins = [
    "https://licenseplate.radrabbit.xyz",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(plate.router, prefix="/api")
app.include_router(words.router, prefix="/api")
