from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class AssessmentSubmission(BaseModel):
    answers: Dict[str, int] = Field(..., description="Map of question_id to selected option index")

class SkillProficiencyItem(BaseModel):
    skill_name: str
    category: str
    score: float
    proficiency_level: str  # "Expert", "Proficient", "Intermediate", "Needs Improvement"
    status_tier: str       # "Strong", "Moderate", "Improve"

class DiscoveryAlignment(BaseModel):
    top_interest_area: Optional[str] = None
    top_interest_percentage: Optional[float] = 0.0
    matching_strong_skills: List[str] = []
    synergy_score: float = 0.0
    summary: str = ""

class SkillAssessmentResultResponse(BaseModel):
    id: Optional[str] = None
    user_id: str
    overall_accuracy: float
    total_questions: int
    correct_answers: int
    skill_scores: Dict[str, float]
    category_scores: Dict[str, float]
    proficiency_levels: Dict[str, str]
    strong_skills: List[str]
    moderate_skills: List[str]
    improve_skills: List[str]
    skill_details: List[SkillProficiencyItem] = []
    discovery_alignment: Optional[DiscoveryAlignment] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

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

