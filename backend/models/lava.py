from typing import List
from pydantic import BaseModel

class LavaQueryRequest(BaseModel):
    query: List[dict]