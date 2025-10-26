from typing import List
from pydantic_settings import BaseSettings
from pydantic import field_validator

from typing import Any

class Settings(BaseSettings):
    API_PREFIX: str = "/api"
    DEBUG: bool = True
    ALLOWED_ORIGINS: str | List[str] = ""
    LAVA_FORWARD_TOKEN: str = ""
    LAVA_BASE_URL: str = ""
    
    # chroma cloud credentials
    API_KEY: str = ""
    TENANT: str = ""
    DATABASE_NAME: str = ""

    # github api token
    GITHUB_TOKEN: str = ""
    GITHUB_OWNER: str = "promatty"
    GITHUB_REPO: str = "example-calculator"

    @field_validator("ALLOWED_ORIGINS")
    @classmethod
    def parse(cls, v: Any) -> List[str]:
        if isinstance(v, list):
            return [str(x) for x in v]

        if isinstance(v, str):
            return v.split(",") if v else []

        return []
        
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

settings = Settings()