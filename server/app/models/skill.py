from typing import Optional
from pydantic import BaseModel

class SkillModel(BaseModel):
    id: str
    name: str
    category: str  # "IT", "Non-IT", "Soft Skills"
    description: Optional[str] = None
