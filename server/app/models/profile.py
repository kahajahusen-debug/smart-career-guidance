from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class UserProfileBase(BaseModel):
    full_name: str
    email: str
    education_level: Optional[str] = "Bachelor's Degree"
    degree: Optional[str] = "B.Tech / B.E."
    branch: Optional[str] = "Computer Science"
    graduation_year: Optional[int] = 2026
    current_skills: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
    preferred_category: str = Field(default="IT", description="IT, Non-IT, or Both")

class UserProfileCreate(UserProfileBase):
    pass

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    education_level: Optional[str] = None
    degree: Optional[str] = None
    branch: Optional[str] = None
    graduation_year: Optional[int] = None
    current_skills: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    preferred_category: Optional[str] = None

class UserProfile(UserProfileBase):
    id: Optional[str] = None
    user_id: str
    updated_at: Optional[str] = None
