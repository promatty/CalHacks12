from fastapi import APIRouter, Depends, HTTPException, Security
from models.chroma import ChromaRequestModel
from core.config import settings
from core.models import ChromaModel
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import chromadb
from chromadb import Search, K, Knn

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

    if credentials.credentials != settings.API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")

    return True

@router.post("/")
async def get_chroma_response(query_request: ChromaRequestModel, authorized: dict = Depends(verify_api_key)):
    #idek what kind of query we want to make here so this is just a placeholder
    chroma_client = ChromaModel.get_chroma_client()

    collection = chroma_client.get_collection("promatty_example_calculator_main")

    all_search = (Search()
               .select(K.DOCUMENT, K.EMBEDDING, K.SCORE, K.METADATA))

    results = collection.search(all_search)

    filenames = list({m["filename"] for m in results["metadatas"][0] if "filename" in m})

    for filename in filenames:
        search_file = (Search()
                       .where(K("filename") == filename)
                       .select(K.ID, K.DOCUMENT, K.METADATA, K.EMBEDDING)
                        .limit(1)
                    )
        results = collection.search(search_file)
        file_len = len(results['documents'][0][0])
        embeddings = results['embeddings'][0][0]

        search = Search().select(K.ID, K.SCORE, K.METADATA).limit(4)

        closests = collection.search(search.rank(Knn(query = embeddings)))

        break

    return {
        "currentFile": filename,
        "fileLength": len(results['documents'][0][0]),
        "distances": closests['scores'][0][1:4],
        "closeFiles": [closests['metadatas'][0][i]['filename'] for i in range(1,4)]
    }


