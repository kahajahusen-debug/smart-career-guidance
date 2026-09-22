from typing import List, Optional
from pydantic import BaseModel, Field

class QuestionModel(BaseModel):
    id: str
    skill_id: str
    skill_name: str
    difficulty: int = Field(ge=1, le=5)  # Difficulty scale 1 (Basic) to 5 (Advanced)
    category: str  # "IT" or "Non-IT"
    question_text: str
    options: List[str]
    correct_option_index: int
    explanation: Optional[str] = None
