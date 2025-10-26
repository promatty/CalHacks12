from fastapi import APIRouter, Depends, HTTPException, Security
from models.chroma import ChromaRequestModel
from core.config import settings
from core.models import ChromaModel
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter(
    prefix="/chroma",
    tags=["chroma"]
)

bearer_scheme = HTTPBearer()

def verify_api_key(credentials: HTTPAuthorizationCredentials = Security(bearer_scheme)):
    if not credentials or not credentials.scheme or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")

    # Ensure scheme is Bearer
    if credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authentication scheme")

    if credentials.credentials != settings.LAVA_FORWARD_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid API key")

    return True

@router.post("/")
async def get_chroma_response(query_request: ChromaRequestModel, authorized: dict = Depends(verify_api_key)):
    #idek what kind of query we want to make here so this is just a placeholder
    chroma_client = ChromaModel.get_chroma_client()
    response = chroma_client.query(
        query_texts=[query_request.query],
        n_results=5,
        include=["metadatas", "documents"])

    return {
        "status_code": response.status_code,
        "response": response.json()
    }


