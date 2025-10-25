from fastapi import APIRouter, Depends, Header, HTTPException
from models.chroma import ChromaRequestModel
from core.config import settings
from core.models import ChromaModel

router = APIRouter(
    prefix="/chroma",
    tags=["chroma"]
)

def verify_api_key(authorization: str = Header(...)):
    if authorization != f"Bearer {settings.API_KEY}":
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
    
    return {"Authorization": authorization, "Content-Type": "application/json"}

@router.post("/")
async def get_chroma_response(query_request: ChromaRequestModel, authorized: dict = Depends(verify_api_key)):
    #idek what kind of query we want to make here so this is just a placeholder
    chroma_client = ChromaModel.get_chroma_clien
    response = chroma_client.query(
        query_texts=[query_request.query],
        n_results=5,
        include=["metadatas", "documents"])

    return {
        "status_code": response.status_code,
        "response": response.json()
    }


