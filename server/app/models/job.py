from typing import List, Dict, Optional
from pydantic import BaseModel, Field

class JobModel(BaseModel):
    id: str
    job_id: Optional[str] = None
    title: str
    company: str
    category: str  # "IT" or "Non-IT"
    career_id: Optional[str] = None
    location: str
    work_mode: Optional[str] = "Hybrid"  # "Remote", "Hybrid", "On-site"
    employment_type: Optional[str] = "Full-time"  # "Full-time", "Part-time", "Internship"
    experience_level: Optional[str] = "Entry Level"
    salary_range: Optional[str] = None
    stipend: Optional[str] = None
    duration: Optional[str] = None
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    education: List[str] = []
    description: Optional[str] = ""
    company_description: Optional[str] = ""
    external_url: Optional[str] = None
    source: Optional[str] = "LinkedIn"
    is_internship: bool = False
    is_sample: bool = True
    search_queries: Optional[Dict[str, str]] = None

