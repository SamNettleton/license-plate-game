from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from router import plate
from router import words
from router import system

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
app.include_router(system.router, prefix="/api")

# unmask_url=True ensures that /api/plate/ABC and /api/plate/XYZ 
# are grouped together in metrics rather than creating thousands of separate entries.
instrumentator = Instrumentator(
    should_group_status_codes=True,
    should_ignore_untemplated=True,
    should_respect_env_var=True,
    should_instrument_requests_inprogress=True,
    excluded_handlers=[".*admin.*", "/metrics"],
    env_var_name="ENABLE_METRICS",
)

instrumentator.instrument(app).expose(app, endpoint="/metrics")
