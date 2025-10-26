from pydantic import BaseModel

class LavaQueryRequest(BaseModel):
    query: str