from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.core.database import db, in_memory_store
from app.core.security import get_current_user, get_optional_user
from app.services.job_recommendation_service import (
    get_all_jobs_raw,
    get_job_by_id_raw,
    calculate_job_match
)
from app.services.recommendation_service import calculate_personalized_recommendations
from app.services.application_service import (
    save_job_for_user,
    unsave_job_for_user,
    get_saved_job_ids_for_user,
    get_applications_for_user
)

router = APIRouter(prefix="/jobs", tags=["Job & Internship Recommendations"])

async def load_user_context(user_id: str):
    if db.is_connected and db.db is not None:
        profile_doc = await db.db.profiles.find_one({"user_id": user_id}, {"_id": 0})
        disc_doc = await db.db.discovery_results.find_one({"user_id": user_id}, {"_id": 0})
        skill_doc = await db.db.skill_assessment_results.find_one({"user_id": user_id}, {"_id": 0})
        action_plan_doc = await db.db.action_plans.find_one({"user_id": user_id}, {"_id": 0}) if hasattr(db.db, 'action_plans') else None
    else:
        profile_doc = in_memory_store.get("profiles", {}).get(user_id)
        disc_doc = in_memory_store.get("discovery_results", {}).get(user_id)
        skill_doc = in_memory_store.get("skill_assessment_results", {}).get(user_id)
        action_plan_doc = in_memory_store.get("action_plans", {}).get(user_id)

    rec_res = await calculate_personalized_recommendations(
        user_id=user_id,
        profile_doc=profile_doc,
        discovery_doc=disc_doc,
        skill_assessment_doc=skill_doc
    )
    recs_list = rec_res.get("recommendations", [])
    saved_job_ids = await get_saved_job_ids_for_user(user_id)
    user_apps = await get_applications_for_user(user_id)
    app_status_map = {a["job_id"]: a["status"] for a in user_apps if "job_id" in a}

    return {
        "profile": profile_doc,
        "discovery": disc_doc,
        "skill_assessment": skill_doc,
        "action_plan": action_plan_doc,
        "recommendations": recs_list,
        "saved_job_ids": saved_job_ids,
        "app_status_map": app_status_map
    }

def filter_jobs_list(
    raw_jobs: List[Dict[str, Any]],
    category: Optional[str] = None,
    location: Optional[str] = None,
    work_mode: Optional[str] = None,
    employment_type: Optional[str] = None,
    experience_level: Optional[str] = None,
    search: Optional[str] = None,
    is_internship: Optional[bool] = None
) -> List[Dict[str, Any]]:
    filtered = []
    for j in raw_jobs:
        # Category filter
        if category and category.lower() != "all":
            if j.get("category", "").lower() != category.lower():
                continue

        # Location filter
        if location and location.lower() != "all":
            if location.lower() not in j.get("location", "").lower():
                continue

        # Work Mode filter
        if work_mode and work_mode.lower() != "all":
            if work_mode.lower() not in j.get("work_mode", "").lower():
                continue

        # Employment Type filter
        if employment_type and employment_type.lower() != "all":
            if employment_type.lower() not in j.get("employment_type", "").lower():
                continue

        # Experience Level filter
        if experience_level and experience_level.lower() != "all":
            if experience_level.lower() not in j.get("experience_level", "").lower():
                continue

        # Internship filter
        if is_internship is not None:
            job_is_intern = bool(j.get("is_internship") or j.get("employment_type", "").lower() == "internship")
            if job_is_intern != is_internship:
                continue

        # Search query filter
        if search:
            q = search.lower().strip()
            title = j.get("title", "").lower()
            company = j.get("company", "").lower()
            desc = j.get("description", "").lower()
            skills = [s.lower() for s in j.get("required_skills", [])]
            loc = j.get("location", "").lower()
            match_search = (q in title or q in company or q in desc or q in loc or any(q in sk for sk in skills))
            if not match_search:
                continue

        filtered.append(j)
    return filtered

@router.get("/recommended", summary="Get Personalized Job & Internship Recommendations")
async def get_recommended_jobs(
    category: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    work_mode: Optional[str] = Query(None),
    employment_type: Optional[str] = Query(None),
    experience_level: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    is_internship: Optional[bool] = Query(None),
    limit: Optional[int] = Query(50),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    u_ctx = await load_user_context(user_id)

    raw_jobs = await get_all_jobs_raw()
    filtered = filter_jobs_list(
        raw_jobs=raw_jobs,
        category=category,
        location=location,
        work_mode=work_mode,
        employment_type=employment_type,
        experience_level=experience_level,
        search=search,
        is_internship=is_internship
    )

    enriched_jobs = []
    for j in filtered:
        match_info = await calculate_job_match(
            job=j,
            profile_doc=u_ctx["profile"],
            discovery_doc=u_ctx["discovery"],
            skill_assessment_doc=u_ctx["skill_assessment"],
            action_plan_doc=u_ctx["action_plan"],
            recommendations_list=u_ctx["recommendations"]
        )

        job_id = str(j.get("job_id") or j.get("id"))
        job_item = {
            **j,
            "job_id": job_id,
            "id": job_id,
            "match_score": match_info["match_score"],
            "matching_skills": match_info["matching_skills"],
            "missing_skills": match_info["missing_skills"],
            "why_this_job_matches": match_info["why_this_job_matches"],
            "recommended_skills": match_info["recommended_skills"],
            "recommended_skill_improvements": match_info["recommended_skill_improvements"],
            "match_breakdown": match_info["match_breakdown"],
            "is_saved": job_id in u_ctx["saved_job_ids"],
            "application_status": u_ctx["app_status_map"].get(job_id)
        }
        enriched_jobs.append(job_item)

    # Sort by match_score descending
    enriched_jobs.sort(key=lambda x: x["match_score"], reverse=True)

    if limit and limit > 0:
        result_jobs = enriched_jobs[:limit]
    else:
        result_jobs = enriched_jobs

    return {
        "jobs": result_jobs,
        "total": len(enriched_jobs),
        "filters": {
            "category": category,
            "location": location,
            "work_mode": work_mode,
            "employment_type": employment_type,
            "experience_level": experience_level,
            "search": search,
            "is_internship": is_internship
        }
    }

@router.get("/saved", summary="Get User's Saved Jobs")
async def get_saved_jobs(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    u_ctx = await load_user_context(user_id)
    saved_ids = u_ctx["saved_job_ids"]

    raw_jobs = await get_all_jobs_raw()
    saved_jobs_list = []
    for j in raw_jobs:
        job_id = str(j.get("job_id") or j.get("id"))
        if job_id in saved_ids:
            match_info = await calculate_job_match(
                job=j,
                profile_doc=u_ctx["profile"],
                discovery_doc=u_ctx["discovery"],
                skill_assessment_doc=u_ctx["skill_assessment"],
                action_plan_doc=u_ctx["action_plan"],
                recommendations_list=u_ctx["recommendations"]
            )
            job_item = {
                **j,
                "job_id": job_id,
                "id": job_id,
                "match_score": match_info["match_score"],
                "matching_skills": match_info["matching_skills"],
                "missing_skills": match_info["missing_skills"],
                "why_this_job_matches": match_info["why_this_job_matches"],
                "recommended_skills": match_info["recommended_skills"],
                "is_saved": True,
                "application_status": u_ctx["app_status_map"].get(job_id)
            }
            saved_jobs_list.append(job_item)

    saved_jobs_list.sort(key=lambda x: x["match_score"], reverse=True)
    return {"jobs": saved_jobs_list, "total": len(saved_jobs_list)}

@router.post("/{job_id}/save", summary="Save / Bookmark a Job")
async def save_job_endpoint(job_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    try:
        res = await save_job_for_user(user_id, job_id)
        return {"message": f"Job '{job_id}' saved successfully.", "saved_job": res}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.delete("/{job_id}/save", summary="Unsave / Remove Bookmarked Job")
async def unsave_job_endpoint(job_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    success = await unsave_job_for_user(user_id, job_id)
    if not success:
        return {"message": f"Job '{job_id}' was not saved or already removed."}
    return {"message": f"Job '{job_id}' removed from saved jobs."}

@router.get("/{job_id}/match", summary="Get Personalized Match Score Details for Specific Job")
async def get_job_match_endpoint(job_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    job = await get_job_by_id_raw(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Job with ID '{job_id}' not found.")

    u_ctx = await load_user_context(user_id)
    match_info = await calculate_job_match(
        job=job,
        profile_doc=u_ctx["profile"],
        discovery_doc=u_ctx["discovery"],
        skill_assessment_doc=u_ctx["skill_assessment"],
        action_plan_doc=u_ctx["action_plan"],
        recommendations_list=u_ctx["recommendations"]
    )
    return {
        "job_id": job_id,
        "title": job.get("title"),
        "company": job.get("company"),
        **match_info
    }

@router.get("/{job_id}", summary="Get Job Details (With Personalized Match Info)")
async def get_job_detail_endpoint(
    job_id: str,
    optional_user: Optional[dict] = Depends(get_optional_user)
):
    job = await get_job_by_id_raw(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Job with ID '{job_id}' not found.")

    clean_id = str(job.get("job_id") or job.get("id"))
    result = {**job, "job_id": clean_id, "id": clean_id}

    if optional_user:
        user_id = optional_user["id"]
        u_ctx = await load_user_context(user_id)
        match_info = await calculate_job_match(
            job=job,
            profile_doc=u_ctx["profile"],
            discovery_doc=u_ctx["discovery"],
            skill_assessment_doc=u_ctx["skill_assessment"],
            action_plan_doc=u_ctx["action_plan"],
            recommendations_list=u_ctx["recommendations"]
        )
        result.update({
            "match_score": match_info["match_score"],
            "matching_skills": match_info["matching_skills"],
            "missing_skills": match_info["missing_skills"],
            "why_this_job_matches": match_info["why_this_job_matches"],
            "recommended_skills": match_info["recommended_skills"],
            "recommended_skill_improvements": match_info["recommended_skill_improvements"],
            "match_breakdown": match_info["match_breakdown"],
            "is_saved": clean_id in u_ctx["saved_job_ids"],
            "application_status": u_ctx["app_status_map"].get(clean_id)
        })

    return result

@router.get("", summary="General Job & Internship Listing Endpoint")
async def get_jobs_general(
    category: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    work_mode: Optional[str] = Query(None),
    employment_type: Optional[str] = Query(None),
    experience_level: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    is_internship: Optional[bool] = Query(None),
    limit: Optional[int] = Query(100)
):
    raw_jobs = await get_all_jobs_raw()
    filtered = filter_jobs_list(
        raw_jobs=raw_jobs,
        category=category,
        location=location,
        work_mode=work_mode,
        employment_type=employment_type,
        experience_level=experience_level,
        search=search,
        is_internship=is_internship
    )

    clean_jobs = []
    for j in filtered:
        job_id = str(j.get("job_id") or j.get("id"))
        clean_jobs.append({**j, "job_id": job_id, "id": job_id})

    if limit and limit > 0:
        clean_jobs = clean_jobs[:limit]

    return {"total": len(clean_jobs), "jobs": clean_jobs}
