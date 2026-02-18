from pydantic import BaseModel

class WordCheckRequest(BaseModel):
    word: str
    sequence: str  # The 3-letter combo from the plate

class WordCheckResponse(BaseModel):
    is_valid: bool
    message: str   # e.g., "Correct!", "Missing a letter", or "Not a real word"