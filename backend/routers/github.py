
from fastapi import APIRouter, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
from typing import Optional

from core.config import settings

router = APIRouter(
    prefix="/github",
    tags=["github"]
)

bearer_scheme = HTTPBearer()


def verify_api_key(credentials: HTTPAuthorizationCredentials = Security(bearer_scheme)):
    if not credentials or not credentials.scheme or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")

    # Ensure scheme is Bearer
    if credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authentication scheme")

    if credentials.credentials != settings.GITHUB_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid API key")

    return True


@router.get("/")
async def get_github_commits(path: Optional[str] = None):
    """Fetch commits from the GitHub commits API for a repo/ref and optionally a file path.

    Use the query parameter `path` to filter commits for a specific file. Include the
    internal API key in the Authorization header (checked by verify_api_key). The
    GitHub token used to call GitHub's API comes from the service settings (GITHUB_TOKEN).
    """
    # verify_api_key(credentials)

    owner = settings.GITHUB_OWNER
    repo = settings.GITHUB_REPO

    # Use the commits LIST endpoint which supports filtering by path and sha
    # This returns the commit history for a file when `path` is provided.
    url = f"https://api.github.com/repos/{owner}/{repo}/commits"

    # Query params — use `sha` to specify the branch/commit and `path` to filter by file
    params = {}
    if path:
        params["path"] = path

    github_token = getattr(settings, "GITHUB_TOKEN")

    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if github_token:
        headers["Authorization"] = f"Bearer {github_token}"

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, params=params)
        except httpx.HTTPError as e:
            # Network-level errors
            raise HTTPException(status_code=502, detail=f"Failed to reach GitHub: {str(e)}")

    # Try to parse JSON; if parsing fails return raw text
    try:
        data = response.json()
    except ValueError:
        data = {"raw_text": response.text}

    return {"status_code": response.status_code, "response": data}