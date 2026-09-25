import json
import uuid
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.database import db, in_memory_store
from app.core.security import get_current_user

router = APIRouter(prefix="/discovery", tags=["Career Discovery"])

# Helper to find dataset paths safely regardless of current working directory
def get_dataset_filepath(filename: str) -> Path:
    current_dir = Path(__file__).resolve().parent
    # Traversing up to root directory from server/app/api/v1
    root_dir = current_dir.parent.parent.parent.parent
    possible_paths = [
        root_dir / "dataset" / filename,
        Path.cwd() / "dataset" / filename,
        Path.cwd().parent / "dataset" / filename
    ]
    for p in possible_paths:
        if p.exists():
            return p
    return possible_paths[0]

def load_discovery_questions_from_file() -> List[Dict[str, Any]]:
    filepath = get_dataset_filepath("discovery_questions.json")
    if not filepath.exists():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Discovery questions dataset file not found at {filepath}"
        )
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read discovery questions dataset: {str(e)}"
        )

def load_careers_from_file() -> List[Dict[str, Any]]:
    filepath = get_dataset_filepath("careers.json")
    if not filepath.exists():
        return []
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

class DiscoverySubmission(BaseModel):
    answers: Dict[str, int] = Field(..., description="Map of question_id (cd_q01..cd_q12) to selected option index (0..3)")

@router.get("/questions", summary="Get all 12 Career Discovery questions")
async def get_discovery_questions():
    questions = load_discovery_questions_from_file()
    return {
        "success": True,
        "questions": questions
    }

@router.post("/submit", summary="Submit Career Discovery answers & calculate interest breakdown")
async def submit_discovery(
    submission: DiscoverySubmission,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    answers = submission.answers

    if not answers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Answers map cannot be empty. Please answer all 12 discovery questions."
        )

    # Load valid questions for validation
    questions = load_discovery_questions_from_file()
    valid_q_map = {q["id"]: q for q in questions}

    # Validate submission inputs
    for q_id, opt_index in answers.items():
        if q_id not in valid_q_map:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid question ID '{q_id}' submitted."
            )
        if not isinstance(opt_index, int) or opt_index < 0 or opt_index > 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid option index '{opt_index}' for question '{q_id}'. Option index must be between 0 and 3."
            )

    if len(answers) < len(questions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"All {len(questions)} questions must be answered before submitting. Received {len(answers)} answers."
        )

    # Scoring calculation (0: Technical, 1: Data, 2: Design, 3: Business)
    technical_score = 0
    data_score = 0
    design_score = 0
    business_score = 0

    for q_id, opt_idx in answers.items():
        if opt_idx == 0:
            technical_score += 1
        elif opt_idx == 1:
            data_score += 1
        elif opt_idx == 2:
            design_score += 1
        elif opt_idx == 3:
            business_score += 1

    total_count = len(answers) # 12

    # Calculate raw percentages and adjust rounding so domain percentages always sum to exactly 100.0%
    scores_dict = {
        "technical": technical_score,
        "data": data_score,
        "design": design_score,
        "business": business_score
    }
    raw_pcts = {k: (v / total_count) * 100.0 for k, v in scores_dict.items()}
    rounded_pcts = {k: round(v, 2) for k, v in raw_pcts.items()}
    diff = round(100.0 - sum(rounded_pcts.values()), 2)
    if diff != 0:
        max_key = max(scores_dict, key=lambda k: scores_dict[k])
        if scores_dict[max_key] > 0:
            rounded_pcts[max_key] = round(rounded_pcts[max_key] + diff, 2)

    technical_pct = rounded_pcts["technical"]
    data_pct = rounded_pcts["data"]
    design_pct = rounded_pcts["design"]
    business_pct = rounded_pcts["business"]

    all_areas = [
        {
            "area": "Technical / Software",
            "score": technical_score,
            "percentage": technical_pct,
            "description": "Building scalable software systems, backend APIs, cloud architectures, and robust code logic."
        },
        {
            "area": "Data / Analytics",
            "score": data_score,
            "percentage": data_pct,
            "description": "Analyzing data trends, building predictive ML models, statistics, and business intelligence."
        },
        {
            "area": "Design / User Experience",
            "score": design_score,
            "percentage": design_pct,
            "description": "Crafting intuitive user interfaces, visual design systems, wireframing, and user research."
        },
        {
            "area": "Business / Management",
            "score": business_score,
            "percentage": business_pct,
            "description": "Leading product strategy, managing team roadmaps, digital marketing, and operations."
        }
    ]

    # Sort areas by score descending
    all_areas.sort(key=lambda x: x["score"], reverse=True)

    # Map top discovery areas to existing careers from careers.json
    all_careers = load_careers_from_file()
    
    # Area mappings to career titles / categories in careers.json
    area_career_map = {
        "Technical / Software": ["Full Stack Software Engineer", "DevOps & Cloud Engineer", "Cybersecurity Analyst"],
        "Data / Analytics": ["Data Scientist & ML Engineer"],
        "Design / User Experience": ["UI/UX Product Designer"],
        "Business / Management": ["Product Manager", "Digital Marketing Strategist", "Financial Analyst & Risk Specialist", "Human Resources & Talent Manager", "Healthcare Operations Administrator"]
    }

    top_area_names = [a["area"] for a in all_areas[:2]] # Top 2 interest areas
    relevant_careers = []

    for car in all_careers:
        car_title = car.get("title", "")
        # Check if career matches top discovery areas
        for top_area in top_area_names:
            matching_titles = area_career_map.get(top_area, [])
            if car_title in matching_titles and car not in relevant_careers:
                relevant_careers.append(car)

    # If no specific matches, default to first 3 careers
    if not relevant_careers:
        relevant_careers = all_careers[:3]

    now_iso = datetime.now(timezone.utc).isoformat()
    result_id = str(uuid.uuid4())

    result_doc = {
        "id": result_id,
        "user_id": user_id,
        "answers": answers,
        "scores": {
            "technical": technical_score,
            "data": data_score,
            "design": design_score,
            "business": business_score
        },
        "percentages": {
            "technical": technical_pct,
            "data": data_pct,
            "design": design_pct,
            "business": business_pct
        },
        "top_areas": all_areas,
        "relevant_careers": relevant_careers,
        "created_at": now_iso,
        "updated_at": now_iso
    }

    # Save result to MongoDB or in-memory fallback
    if db.is_connected and db.db is not None:
        db_doc = result_doc.copy()
        db_doc["_id"] = result_id
        await db.db.discovery_results.delete_many({"user_id": user_id})
        await db.db.discovery_results.insert_one(db_doc)
    else:
        in_memory_store["discovery_results"][user_id] = result_doc

    return {
        "success": True,
        "result": result_doc
    }

@router.get("/me", summary="Get current logged-in user's latest Career Discovery result")
async def get_my_discovery_result(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]

    if db.is_connected and db.db is not None:
        result_doc = await db.db.discovery_results.find_one({"user_id": user_id}, {"_id": 0})
    else:
        result_doc = in_memory_store.get("discovery_results", {}).get(user_id)

    if not result_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No Career Discovery results found for current user."
        )

    return {
        "success": True,
        "result": result_doc
    }
