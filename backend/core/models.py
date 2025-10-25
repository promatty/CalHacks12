from pydantic import BaseModel
from core.config import settings
import chromadb
class ChromaModel(BaseModel):

    @classmethod
    def get_chroma_client(cls):
        api_key = settings.API_KEY
        tenant = settings.TENANT
        database_name = settings.DATABASE_NAME

        if api_key and tenant and database_name:
            client = chromadb.CloudClient(api_key=api_key, tenant=tenant, database=database_name)
            return client

        raise ValueError("Chroma client configuration is incomplete.")