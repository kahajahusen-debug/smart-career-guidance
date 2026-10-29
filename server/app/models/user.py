from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UserSignup(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    confirm_password: str
    education_level: Optional[str] = ""
    degree: Optional[str] = ""
    branch: Optional[str] = ""
    experience_level: Optional[str] = "Student / Fresher"
    preferred_category: Optional[str] = "Undecided"
    current_skills: Optional[list[str]] = Field(default_factory=list)
    interests: Optional[list[str]] = Field(default_factory=list)
    graduation_year: Optional[int] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    full_name: str
    email: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[str] = None
