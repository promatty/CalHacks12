from fastapi import APIRouter
from models.chroma import ChromaRequestModel
from core.models import ChromaModel
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from chromadb import Search, K, Knn

router = APIRouter(
    prefix="/chroma",
    tags=["chroma"]
)

bearer_scheme = HTTPBearer()

@router.get("/all")
async def get_chroma_response():
    chroma_client = ChromaModel.get_chroma_client()

    collection = chroma_client.get_collection("promatty_example_calculator_main")

    all_search = (Search()
               .select(K.DOCUMENT, K.EMBEDDING, K.SCORE, K.METADATA))

    results = collection.search(all_search)

    filenames = list({m["filename"] for m in results["metadatas"][0] if "filename" in m})

    responses = []

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

        model = ChromaRequestModel(
            currentFile=filename,
            fileLength=file_len,
            distances=closests['scores'][0][1:4],
            closeFiles=[closests['metadatas'][0][i]['filename'] for i in range(1,4)]
        )
        responses.append(model)

    return responses