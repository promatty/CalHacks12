
from pydantic import BaseModel

class ChromaRequestModel(BaseModel):
    query: str
    context: str
