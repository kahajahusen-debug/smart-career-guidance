from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class AssessmentSubmission(BaseModel):
    answers: Dict[str, int] = Field(..., description="Map of question_id to selected option index")

class SkillGapItem(BaseModel):
    skill_name: str
    user_score: float
    target_score: float
    status: str  # "Strong", "Good", "Improve"

class CareerRecommendationItem(BaseModel):
    career_id: str
    title: str
    category: str
    suitability_score: float
    description: str
    matching_skills: List[str]
    skill_gaps: List[SkillGapItem]
    average_salary: str
    growth_rate: str
    common_roles: List[str]

class AssessmentResultResponse(BaseModel):
    id: Optional[str] = None
    user_id: str
    assessment_score: float
    career_recommendations: List[CareerRecommendationItem]
    matched_skills: List[str]
    missing_skills: List[str]
    recommended_projects: List[Dict[str, Any]]
    created_at: Optional[str] = None
