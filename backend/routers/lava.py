import json
from fastapi import APIRouter
import httpx
from models.lava import LavaQueryRequest
from core.config import settings

router = APIRouter(
    prefix="/lava",
    tags=["lava"]
)

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

1. The root object must have two keys: "nodes" and "edges".

2. Each node represents a file.
   - id: a unique string identifier (e.g. "1", "2", ...).
   - name: the filename (e.g. "App.tsx").
   - editCount: a random integer between 2 and 13.
   - lengthOfFile: the provided "fileLength" value.

3. Each edge represents a relationship between files based on the "closeFiles" field.
   - For each object in the input:
       - Create an edge from the "currentFile" to every file listed in "closeFiles".
       - The "source" should be the id of the "currentFile".
       - The "target" should be the id of the close file.
   - Each edge must have a unique id like "e1", "e2", "e3", etc.

4. If a file appears as a "closeFile" but does not have its own "currentFile" entry, still create a node for it using a random editCount (2–13) and a random lengthOfFile (between 20–250).

5. The ids for nodes should be unique and consistent across edges.
   - Example: if "calculator.py" is id "1", all edges involving "calculator.py" must reference source or target "1".

6. Do not include any text, comments, or explanations — only valid JSON.

7. One node should only have a max of 3 edges originating from it.

The output must always follow this exact structure and field names.
"""

@router.post("/")
async def get_lava_response(query_request: LavaQueryRequest):
    url = f"{settings.LAVA_BASE_URL}/forward?u=https://api.openai.com/v1/chat/completions"

    # must include context as system message if provided
    messages = [
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": context
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": f"Here is the file info:\n{json.dumps(query_request.query, indent=2)}"
                }
            ]
        }
    ]

    request_body = {
        "model": "gpt-4o-mini",
        "messages": messages,
        "response_format": { "type": "json_object" },
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
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