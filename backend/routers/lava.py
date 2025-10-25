from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
from models.lava import LavaQueryRequest
from core.config import settings

router = APIRouter(
    prefix="/lava",
    tags=["lava"]
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
async def get_lava_response(query_request: LavaQueryRequest, credentials: HTTPAuthorizationCredentials = Security(bearer_scheme)):
    # Validate credentials (keeps validation logic centralized)
    verify_api_key(credentials)
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
        response = await client.post(
            url, 
            json=request_body, 
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {settings.LAVA_FORWARD_TOKEN}"
            }
        )

    return {
        "status_code": response.status_code,
        "response": response.json()
    }