from fastapi import APIRouter

router = APIRouter(
    prefix="/chroma",
    tags=["chroma"]
)


@router.get("/{query}")
def get_chroma_response(query: str):
    # add query here for collection
    return {"message": f"Chroma response for query: {query}"}