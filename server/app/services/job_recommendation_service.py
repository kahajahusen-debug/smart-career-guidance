import logging
from typing import Dict, List, Any, Optional
from app.core.database import db, in_memory_store
from app.db.seeds.seed_data import JOBS_SEED, CAREERS_SEED

logger = logging.getLogger("uvicorn")

async def get_all_jobs_raw() -> List[Dict[str, Any]]:
    if db.is_connected and db.db is not None:
        cursor = db.db.jobs.find({}, {"_id": 0})
        jobs = await cursor.to_list(length=200)
        if jobs:
            return jobs
    jobs = in_memory_store.get("jobs", [])
    if jobs:
        return jobs
    return JOBS_SEED

async def get_job_by_id_raw(job_id: str) -> Optional[Dict[str, Any]]:
    jobs = await get_all_jobs_raw()
    for j in jobs:
        j_id = str(j.get("job_id") or j.get("id") or "")
        if j_id == str(job_id):
            return j
    return None

async def calculate_job_match(
    job: Dict[str, Any],
    profile_doc: Optional[Dict[str, Any]] = None,
    discovery_doc: Optional[Dict[str, Any]] = None,
    skill_assessment_doc: Optional[Dict[str, Any]] = None,
    action_plan_doc: Optional[Dict[str, Any]] = None,
    recommendations_list: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Phase 7 Job Recommendation Engine.
    
    Formula:
      Job Match Score =
          35% Skill Match
        + 20% Career Match
        + 15% Assessment Match
        + 10% Education Match
        + 10% Experience Match
        + 10% Preference Match
    """
    req_skills = [s.strip() for s in job.get("required_skills", [])]
    pref_skills = [s.strip() for s in job.get("preferred_skills", [])]
    job_education = [e.strip().lower() for e in job.get("education", [])]
    job_category = job.get("category", "IT")
    job_career_id = job.get("career_id", "")
    job_exp = job.get("experience_level", "Entry Level").lower()
    job_work_mode = job.get("work_mode", "Hybrid").lower()

    # User Skills
    user_skills_raw = profile_doc.get("current_skills", []) if profile_doc else []
    user_skills_set = {s.strip().lower() for s in user_skills_raw if isinstance(s, str)}

    ass_strong = [s.lower() for s in (skill_assessment_doc.get("strong_skills", []) if skill_assessment_doc else [])]
    ass_moderate = [s.lower() for s in (skill_assessment_doc.get("moderate_skills", []) if skill_assessment_doc else [])]
    ass_improve = [s.lower() for s in (skill_assessment_doc.get("improve_skills", []) if skill_assessment_doc else [])]

    # Combined user known skills
    combined_user_skills = user_skills_set.union(set(ass_strong)).union(set(ass_moderate))

    # 1. Skill Match (35%)
    req_matches = []
    req_missing = []
    for s in req_skills:
        s_lower = s.lower()
        if any(us in s_lower or s_lower in us for us in combined_user_skills):
            req_matches.append(s)
        else:
            req_missing.append(s)

    pref_matches = []
    for s in pref_skills:
        s_lower = s.lower()
        if any(us in s_lower or s_lower in us for us in combined_user_skills):
            pref_matches.append(s)

    if req_skills:
        req_ratio = len(req_matches) / len(req_skills)
    else:
        req_ratio = 0.5

    if pref_skills:
        pref_ratio = len(pref_matches) / len(pref_skills)
        skill_score = (req_ratio * 0.8 + pref_ratio * 0.2) * 100.0
    else:
        skill_score = req_ratio * 100.0

    # 2. Career Match (20%)
    career_score = 40.0
    target_career_title = ""
    if action_plan_doc and action_plan_doc.get("target_career_id"):
        if action_plan_doc.get("target_career_id") == job_career_id:
            career_score = 100.0
            target_career_title = action_plan_doc.get("target_career_title", "")

    if career_score < 100.0 and recommendations_list:
        for idx, rec in enumerate(recommendations_list[:5]):
            rec_cid = rec.get("career_id", "")
            rec_title = rec.get("title", "")
            if rec_cid == job_career_id or rec_title.lower() in job.get("title", "").lower():
                if idx == 0:
                    career_score = max(career_score, 95.0)
                elif idx < 3:
                    career_score = max(career_score, 85.0)
                else:
                    career_score = max(career_score, 70.0)

    # 3. Assessment Match (15%)
    if skill_assessment_doc and skill_assessment_doc.get("overall_accuracy") is not None:
        accuracy = float(skill_assessment_doc.get("overall_accuracy", 50.0))
        # Boost if strong skills overlap with required skills
        strong_overlap = len([s for s in req_skills if s.lower() in ass_strong])
        assessment_score = min(100.0, accuracy + (strong_overlap * 5.0))
    else:
        assessment_score = 60.0

    # 4. Education Match (10%)
    user_degree = (profile_doc.get("degree", "") if profile_doc else "").lower()
    user_major = (profile_doc.get("major", "") if profile_doc else "").lower()
    user_edu_level = (profile_doc.get("education_level", "") if profile_doc else "").lower()

    education_score = 50.0
    if job_education:
        for edu in job_education:
            if edu in user_degree or edu in user_major or edu in user_edu_level or user_major in edu or user_degree in edu:
                education_score = 100.0
                break
            elif "computer" in edu and ("cs" in user_degree or "it" in user_degree or "tech" in user_degree):
                education_score = 85.0
    else:
        education_score = 75.0

    # 5. Experience Match (10%)
    if "entry" in job_exp or "0" in job_exp or "junior" in job_exp or job.get("is_internship"):
        experience_score = 100.0
    elif "mid" in job_exp or "1" in job_exp or "2" in job_exp or "3" in job_exp:
        experience_score = 85.0
    else:
        experience_score = 65.0

    # 6. Preference Match (10%)
    pref_cat = (profile_doc.get("preferred_category", "Both") if profile_doc else "Both").strip()
    if pref_cat.lower() == "both" or pref_cat.lower() == job_category.lower():
        pref_score = 95.0
    else:
        pref_score = 40.0

    # Total Weighted Match Score
    raw_match_score = (
        (0.35 * skill_score) +
        (0.20 * career_score) +
        (0.15 * assessment_score) +
        (0.10 * education_score) +
        (0.10 * experience_score) +
        (0.10 * pref_score)
    )

    final_match_score = max(0, min(100, int(round(raw_match_score))))

    # All matching vs missing skills
    all_matching_skills = req_matches + pref_matches
    all_missing_skills = req_missing

    # Explainable Why This Job Matches
    reasons = []
    if req_matches:
        reasons.append(f"Your skills in {', '.join(req_matches[:3])} directly match the primary requirements for this role.")
    if career_score >= 80:
        reasons.append("This role aligns closely with your top recommended career path and target goals.")
    if assessment_score >= 70:
        reasons.append("Your skill assessment scores demonstrate solid proficiency in key required competencies.")
    if education_score >= 80:
        reasons.append("Your educational background aligns with the qualification criteria.")

    if not reasons:
        reasons.append("This opportunity provides an entry point to gain practical industry skills and expand your portfolio.")

    why_matches = " ".join(reasons)

    # Recommended skill improvements
    recommended_improvements = list(set(req_missing + ass_improve))

    return {
        "match_score": final_match_score,
        "matching_skills": all_matching_skills,
        "missing_skills": all_missing_skills,
        "why_this_job_matches": why_matches,
        "recommended_skill_improvements": recommended_improvements,
        "recommended_skills": recommended_improvements,
        "match_breakdown": {
            "skill_match": round(skill_score, 1),
            "career_match": round(career_score, 1),
            "assessment_match": round(assessment_score, 1),
            "education_match": round(education_score, 1),
            "experience_match": round(experience_score, 1),
            "preference_match": round(pref_score, 1)
        }
    }
