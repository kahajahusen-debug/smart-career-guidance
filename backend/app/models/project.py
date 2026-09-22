from typing import List, Optional
from pydantic import BaseModel

class ProjectModel(BaseModel):
    id: str
    title: str
    category: str  # "IT" or "Non-IT"
    difficulty: str  # "Beginner", "Intermediate", "Advanced"
    description: str
    skills_covered: List[str]
    deliverables: List[str]
