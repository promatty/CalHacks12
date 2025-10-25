from fastapi import APIRouter, Depends, Header, HTTPException
import httpx
from models.lava import LavaQueryRequest
from core.config import settings

router = APIRouter(
    prefix="/lava",
    tags=["lava"]
)

def verify_api_key(authorization: str = Header(...)):
    if authorization != f"Bearer {settings.LAVA_FORWARD_TOKEN}":
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
    
    return {"Authorization": authorization, "Content-Type": "application/json"}

@router.post("/")
async def get_lava_response(query_request: LavaQueryRequest, authorized: dict = Depends(verify_api_key)):
    url = f"{settings.LAVA_BASE_URL}/forward?u=https://api.openai.com/v1/chat/completions"

    # must include context as system message if provided
    messages = []
    if getattr(query_request, "context", None):
        messages.append({"role": "system", "content": query_request.context})

    messages.append({"role": "user", "content": query_request.query})

    request_body = {
        "model": "gpt-4o-mini",
        "messages": messages
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=authorized, json=request_body)

    return {
        "status_code": response.status_code,
        "response": response.json()
    }


