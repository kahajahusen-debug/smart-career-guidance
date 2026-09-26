import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from app.core.database import db, in_memory_store
from app.core.security import get_current_user, get_optional_user
from app.models.assessment import (
    AssessmentSubmission, 
    AssessmentResultResponse,
    SkillAssessmentResultResponse
)
from app.services.recommendation import generate_career_recommendations
from app.services.assessment_service import (
    evaluate_advanced_skill_assessment,
    get_all_questions
)

router = APIRouter(prefix="/assessment", tags=["Career Assessment & Recommendations"])
skill_assessment_router = APIRouter(prefix="/skill-assessment", tags=["Advanced Skill Assessment Engine"])

# --- PHASE 2/3 EXISTING ASSESSMENT ENDPOINTS (PRESERVED) ---

@router.post("/submit", response_model=AssessmentResultResponse, summary="Submit career assessment answers & generate personalized recommendations")
async def submit_assessment(
    submission: AssessmentSubmission,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]

    if not submission.answers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assessment submission cannot be empty. Please answer the assessment questions."
        )

    # Load current user's profile
    if db.is_connected and db.db is not None:
        profile_doc = await db.db.profiles.find_one({"user_id": user_id}, {"_id": 0})
    else:
        profile_doc = in_memory_store.get("profiles", {}).get(user_id)

    if not profile_doc:
        profile_doc = {
            "user_id": user_id,
            "full_name": current_user.get("full_name", ""),
            "current_skills": ["Python", "JavaScript"],
            "interests": ["Software Engineering"],
            "preferred_category": "IT"
        }

    # Execute recommendation scoring engine
    result_response = await generate_career_recommendations(
        user_id=user_id,
        profile_data=profile_doc,
        answers=submission.answers
    )

    now_iso = datetime.now(timezone.utc).isoformat()
    result_dict = result_response.model_dump()
    result_dict["created_at"] = now_iso
    result_dict["answers"] = submission.answers

    # Save to MongoDB or in-memory fallback
    if db.is_connected and db.db is not None:
        doc_id = str(uuid.uuid4())
        result_dict["id"] = doc_id
        db_doc = result_dict.copy()
        db_doc["_id"] = doc_id
        await db.db.assessment_results.delete_many({"user_id": user_id})
        await db.db.assessment_results.insert_one(db_doc)
    else:
        doc_id = str(uuid.uuid4())
        result_dict["id"] = doc_id
        in_memory_store["assessment_results"][user_id] = result_dict

    # Also compute & save Phase 4 detailed skill assessment result
    adv_eval = await evaluate_advanced_skill_assessment(user_id, submission.answers)
    adv_eval["id"] = str(uuid.uuid4())
    adv_eval["user_id"] = user_id
    adv_eval["created_at"] = now_iso
    adv_eval["updated_at"] = now_iso
    
    if db.is_connected and db.db is not None:
        db_adv = adv_eval.copy()
        db_adv["_id"] = adv_eval["id"]
        await db.db.skill_assessment_results.delete_many({"user_id": user_id})
        await db.db.skill_assessment_results.insert_one(db_adv)
    else:
        in_memory_store["skill_assessment_results"][user_id] = adv_eval

    return result_response

@router.get("/me", summary="Get latest assessment results and recommendations for logged-in user")
async def get_my_assessment_result(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]

    if db.is_connected and db.db is not None:
        result_doc = await db.db.assessment_results.find_one({"user_id": user_id}, {"_id": 0, "answers": 0})
    else:
        result_doc = in_memory_store.get("assessment_results", {}).get(user_id)

    if not result_doc:
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": False,
                "completed": False,
                "message": "No assessment results found. Please complete the assessment first."
            }
        )

    return result_doc


# --- PHASE 4 ADVANCED SKILL ASSESSMENT ENGINE ENDPOINTS ---

@skill_assessment_router.get("/questions", summary="Get Skill Assessment Questions Bank")
async def get_skill_assessment_questions(
    category: Optional[str] = Query(None, description="IT or Non-IT"),
    difficulty: Optional[int] = Query(None, ge=1, le=5, description="Difficulty 1 to 5"),
    skill_category: Optional[str] = Query(None, description="Skill Category e.g. Programming, Database / SQL"),
    current_user: Optional[dict] = Depends(get_optional_user)
):
    questions = await get_all_questions()

    if category and category.lower() != "all":
        questions = [q for q in questions if q.get("category", "").lower() == category.lower()]
    if difficulty:
        questions = [q for q in questions if q.get("difficulty") == difficulty]
    if skill_category:
        questions = [q for q in questions if q.get("skill_category", "").lower() == skill_category.lower()]

    return {
        "success": True,
        "total": len(questions),
        "questions": questions
    }

@skill_assessment_router.post("/submit", response_model=SkillAssessmentResultResponse, summary="Submit Skill Assessment & Calculate Skill Proficiency Breakdown")
async def submit_skill_assessment(
    submission: AssessmentSubmission,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]

    if not submission.answers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Skill assessment answers cannot be empty. Please answer the assessment questions."
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    doc_id = str(uuid.uuid4())

    # Calculate detailed skill breakdown and discovery connection
    eval_result = await evaluate_advanced_skill_assessment(user_id, submission.answers)
    eval_result["id"] = doc_id
    eval_result["user_id"] = user_id
    eval_result["created_at"] = now_iso
    eval_result["updated_at"] = now_iso

    # Save to MongoDB or in-memory fallback
    if db.is_connected and db.db is not None:
        db_doc = eval_result.copy()
        db_doc["_id"] = doc_id
        await db.db.skill_assessment_results.delete_many({"user_id": user_id})
        await db.db.skill_assessment_results.insert_one(db_doc)
    else:
        in_memory_store["skill_assessment_results"][user_id] = eval_result

    # Also update career recommendations in background
    if db.is_connected and db.db is not None:
        profile_doc = await db.db.profiles.find_one({"user_id": user_id}, {"_id": 0})
    else:
        profile_doc = in_memory_store.get("profiles", {}).get(user_id)

    if not profile_doc:
        profile_doc = {
            "user_id": user_id,
            "full_name": current_user.get("full_name", ""),
            "current_skills": ["Python", "JavaScript"],
            "interests": ["Software Engineering"],
            "preferred_category": "IT"
        }

    rec_response = await generate_career_recommendations(user_id, profile_doc, submission.answers)
    rec_dict = rec_response.model_dump()
    rec_dict["id"] = str(uuid.uuid4())
    rec_dict["created_at"] = now_iso

    if db.is_connected and db.db is not None:
        rec_db = rec_dict.copy()
        rec_db["_id"] = rec_dict["id"]
        await db.db.assessment_results.delete_many({"user_id": user_id})
        await db.db.assessment_results.insert_one(rec_db)
    else:
        in_memory_store["assessment_results"][user_id] = rec_dict

    return SkillAssessmentResultResponse(**eval_result)

@skill_assessment_router.get("/me", summary="Get latest Skill Assessment result for current user")
async def get_my_skill_assessment_result(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]

    if db.is_connected and db.db is not None:
        result_doc = await db.db.skill_assessment_results.find_one({"user_id": user_id}, {"_id": 0})
    else:
        result_doc = in_memory_store.get("skill_assessment_results", {}).get(user_id)

    if not result_doc:
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": False,
                "completed": False,
                "message": "No skill assessment results found. Please complete the skill assessment first."
            }
        )

    return result_doc

