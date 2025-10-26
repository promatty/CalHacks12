from fastapi import APIRouter, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
from models.lava import LavaQueryRequest
from core.config import settings

router = APIRouter(
    prefix="/lava",
    tags=["lava"]
)

bearer_scheme = HTTPBearer()

context = """
You are a TypeScript data generator that converts Chroma query results into a JSON object representing a dependency graph.
Always respond with a JSON object of the exact format below:

{
  "nodes": [
    { "id": "string", "name": "string", "editCount": number, "lengthOfFile": number }
  ],
  "edges": [
    { "id": "string", "source": "string", "target": "string" }
  ]
}

Rules:

The root object must have two keys: "nodes" and "edges".

Each node represents a file.

id: a unique string identifier (e.g. "1", "2", ...).

name: the filename (e.g. "App.tsx").

editCount: a number representing any file metric. You can make this metric up though and make it between 2-13.

lengthOfFile: a number representing the length of the file (e.g. in lines of code).

Each edge represents a relationship between two files.

source: the id of the originating file.

target: the id of the connected file.

id: a unique edge ID (e.g. "e1", "e2", etc.).

Do not include any text, comments, or explanations — only valid JSON.

The output must always follow this exact structure and field names.
"""


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
    messages.append({"role": "system", "content": context})
    messages.append({"role": "user", "content": query_request.query})

    request_body = {
        "model": "gpt-4o-mini",
        "messages": messages,
        "response_format": { type: "json_object" },
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