import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.database import db, in_memory_store
from app.core.security import get_current_user
from app.models.assessment import AssessmentSubmission, AssessmentResultResponse
from app.services.recommendation import generate_career_recommendations

router = APIRouter(prefix="/assessment", tags=["Career Assessment & Recommendations"])

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

    # Execute scoring engine
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
        # Replace existing assessment result for this user or insert new
        await db.db.assessment_results.delete_many({"user_id": user_id})
        await db.db.assessment_results.insert_one(db_doc)
    else:
        doc_id = str(uuid.uuid4())
        result_dict["id"] = doc_id
        in_memory_store["assessment_results"][user_id] = result_dict

    return result_response

@router.get("/me", response_model=AssessmentResultResponse, summary="Get latest assessment results and recommendations for logged-in user")
async def get_my_assessment_result(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]

    if db.is_connected and db.db is not None:
        result_doc = await db.db.assessment_results.find_one({"user_id": user_id}, {"_id": 0, "answers": 0})
    else:
        result_doc = in_memory_store.get("assessment_results", {}).get(user_id)

    if not result_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No assessment results found. Please complete the assessment first."
        )

    return AssessmentResultResponse(**result_doc)
