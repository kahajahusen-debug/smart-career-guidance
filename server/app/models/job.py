from typing import List, Dict, Optional
from pydantic import BaseModel

class JobModel(BaseModel):
    id: str
    title: str
    company: str
    category: str  # "IT" or "Non-IT"
    location: str
    required_skills: List[str]
    experience_level: str
    salary_range: str
    search_queries: Dict[str, str]  # {"linkedin": "...", "naukri": "...", "indeed": "..."}
