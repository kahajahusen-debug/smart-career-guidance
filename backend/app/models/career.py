from typing import List, Optional
from pydantic import BaseModel, Field

class SkillRequirement(BaseModel):
    skill_name: str
    weight: float = 1.0  # Core importance 0.1 to 1.0
    target_score: int = 75 # Standard benchmark level 0-100

class CareerProfile(BaseModel):
    id: str
    title: str
    category: str  # "IT" or "Non-IT"
    description: str
    average_salary: str
    growth_rate: str
    required_skills: List[SkillRequirement]
    common_roles: List[str]
    entry_requirements: Optional[str] = None
