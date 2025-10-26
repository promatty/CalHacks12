
from pydantic import BaseModel

class ChromaRequestModel(BaseModel):
    currentFile: str
    fileLength: int
    distances: list[float]
    closeFiles: list[str]
