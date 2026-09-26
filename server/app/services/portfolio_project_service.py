import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from fastapi import HTTPException, status
from app.core.database import db, in_memory_store
from app.services.recommendation_service import get_all_careers_data, calculate_personalized_recommendations

logger = logging.getLogger("uvicorn")

VALID_STATUSES = ["Not Started", "In Progress", "Completed"]

async def fetch_master_projects() -> List[Dict[str, Any]]:
    """Fetch all portfolio projects from MongoDB or in-memory fallback."""
    projects = []
    if db.is_connected and db.db is not None:
        projects = await db.db.projects.find({}, {"_id": 0}).to_list(length=100)
        if not projects:
            projects = await db.db.portfolio_projects.find({}, {"_id": 0}).to_list(length=100)
    else:
        projects = in_memory_store.get("projects", [])
        if not projects:
            projects = in_memory_store.get("portfolio_projects", [])

    if not projects:
        from app.db.seeds.seed_data import PROJECTS_SEED
        projects = PROJECTS_SEED
    return projects

def normalize_project_id(proj: Dict[str, Any]) -> str:
    """Extract standard project ID."""
    return proj.get("id") or proj.get("project_id") or "proj_unknown"

async def get_all_projects(category: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get catalog of all portfolio projects filtered optionally by category."""
    projects = await fetch_master_projects()
    if category and category.lower() != "all":
        projects = [p for p in projects if p.get("category", "").lower() == category.lower()]
    return projects

def calculate_project_match_score(
    proj: Dict[str, Any],
    target_career_title: str,
    target_career_category: str,
    current_skills: set,
    skill_gaps: list,
    suitability_score: float,
    user_skill_scores: Optional[Dict[str, int]] = None
) -> Dict[str, Any]:
    """
    5-part weighted recommendation model (0-100 score):
    1. Target Career Relevance (35%): 35 pts if title match, 17.5 if category match, 3.5 if unrelated.
    2. Skill Gap Alignment (30%): Overlap between project skills and user missing/needs improvement skills.
    3. Current Skill Compatibility (15%): Optimal for partial overlap with user's current skills.
    4. Difficulty / Readiness Fit (10%): Match between project difficulty and user readiness.
    5. Portfolio Value (10%): Project portfolio value score (0-100) scaled to 10 pts.
    """
    user_skill_scores = user_skill_scores or {}
    p_skills = proj.get("skills_covered", [])
    p_skills_lower = [s.lower() for s in p_skills]
    p_target_careers = [tc.lower() for tc in proj.get("target_careers", [])]
    p_category = proj.get("category", "IT")
    p_difficulty = proj.get("difficulty", "Intermediate")
    p_portfolio_val = float(proj.get("portfolio_value", 90))

    # 1. Target Career Relevance (35 pts)
    target_title_low = target_career_title.lower()
    if any(target_title_low in tc or tc in target_title_low for tc in p_target_careers):
        career_rel = 35.0
    elif p_category.lower() == target_career_category.lower():
        career_rel = 17.5
    else:
        career_rel = 3.5

    # 2. Skill Gap Alignment (30 pts)
    gaps_lower = [g.lower() for g in skill_gaps]
    matching_gaps = [s for s, s_low in zip(p_skills, p_skills_lower) if any(g in s_low or s_low in g for g in gaps_lower)]
    if gaps_lower:
        gap_ratio = len(matching_gaps) / max(1, len(p_skills))
        skill_gap_score = min(30.0, round(gap_ratio * 40.0, 1))
        if matching_gaps and skill_gap_score < 15.0:
            skill_gap_score = 15.0
    else:
        skill_gap_score = 5.0

    # 3. Current Skill Compatibility (15 pts)
    curr_lower = [cs.lower() for cs in current_skills]
    matching_curr = [s for s, s_low in zip(p_skills, p_skills_lower) if any(c in s_low or s_low in c for c in curr_lower)]
    if matching_curr:
        if len(matching_curr) < len(p_skills):
            skill_comp = 15.0  # Optimal challenge: partial familiarity
        else:
            skill_comp = 10.0  # Already knows everything
    else:
        skill_comp = 5.0  # Steep learning curve

    # 4. Difficulty / Readiness Fit (10 pts)
    if suitability_score >= 80.0:
        fit_score = 10.0 if p_difficulty.lower() in ["intermediate", "advanced"] else 6.0
    elif suitability_score >= 50.0:
        fit_score = 10.0 if p_difficulty.lower() in ["beginner", "intermediate"] else 7.0
    else:
        fit_score = 10.0 if p_difficulty.lower() == "beginner" else 5.0

    # 5. Portfolio Value (10 pts)
    port_val_fit = round((p_portfolio_val / 100.0) * 10.0, 1)

    # Total score MUST equal exact sum of breakdown components (Requirement 2)
    total_score = round(career_rel + skill_gap_score + skill_comp + fit_score + port_val_fit, 1)
    total_score = min(100.0, max(10.0, total_score))

    # Priority Classification (Requirement 1):
    # High Priority: >= 75% AND strong target career relevance AND addresses skill gaps
    if total_score >= 75.0 and (career_rel >= 17.5 or len(matching_gaps) >= 1):
        priority = "High Priority"
    elif total_score >= 55.0:
        priority = "Recommended"
    else:
        priority = "Explore"

    # Dynamic explanation generator (Requirement 8 - concise, non-repetitive)
    if priority == "High Priority":
        if matching_gaps:
            gap_str = " and ".join(matching_gaps[:2])
            reason = f"Best aligned with your {target_career_title} goal and targets your {gap_str} skill gaps."
        else:
            reason = f"Best aligned with your {target_career_title} goal and provides high industry portfolio value."
    elif priority == "Recommended":
        if matching_gaps:
            gap_str = " and ".join(matching_gaps[:2])
            reason = f"Strengthens {gap_str} while building practical project experience for {target_career_title}."
        elif matching_curr:
            curr_str = " and ".join(matching_curr[:2])
            reason = f"Strengthens {curr_str} while giving you practical experience with {p_category} projects."
        else:
            reason = f"Builds practical experience with {p_category} workflows relevant to your growth."
    else:  # Explore
        reason = f"Provides useful {p_category} exposure that can broaden your technical portfolio."

    # Skills you will improve array (Requirements 3 & 4 - max 3 skills, real personalization)
    sorted_p_skills = sorted(
        p_skills,
        key=lambda s: (
            0 if any(g in s.lower() or s.lower() in g for g in gaps_lower) else
            (1 if any(c in s.lower() or s.lower() in c for c in curr_lower) else 2)
        )
    )

    skills_you_will_improve = []
    for s in sorted_p_skills[:3]:
        s_low = s.lower()
        is_gap = any(g in s_low or s_low in g for g in gaps_lower)
        is_curr = any(c in s_low or s_low in c for c in curr_lower)
        eval_score = user_skill_scores.get(s_low)

        if is_gap:
            c_val = eval_score if eval_score is not None else 0 if "missing" in s_low else 35
            t_val = min(90, max(75, c_val + 40))
            level_display = f"{c_val}% → {t_val}%"
            curr_lvl_str, targ_lvl_str = f"{c_val}%", f"{t_val}%"
        elif is_curr or eval_score is not None:
            c_val = eval_score if eval_score is not None else 60
            t_val = min(95, c_val + 25)
            level_display = f"{c_val}% → {t_val}%"
            curr_lvl_str, targ_lvl_str = f"{c_val}%", f"{t_val}%"
        else:
            level_display = "Priority Skill to Practice"
            curr_lvl_str, targ_lvl_str = "Priority", "Practice"

        skills_you_will_improve.append({
            "skill_name": s,
            "current_level": curr_lvl_str,
            "target_level": targ_lvl_str,
            "level_display": level_display,
            "is_gap": is_gap
        })

    return {
        "match_score": total_score,
        "priority": priority,
        "reason": reason,
        "matching_skills": matching_curr,
        "skill_gaps_addressed": matching_gaps,
        "skills_you_will_improve": skills_you_will_improve,
        "match_score_breakdown": {
            "target_career_relevance": career_rel,
            "skill_gap_alignment": skill_gap_score,
            "current_skill_compatibility": skill_comp,
            "difficulty_readiness_fit": fit_score,
            "portfolio_value_fit": port_val_fit
        }
    }

async def get_personalized_project_recommendations(
    user_id: str,
    category: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Calculate personalized project recommendations with 5-part weighted scoring,
    priority levels ('High Priority', 'Recommended', 'Explore'), skill gap level improvements,
    and milestone progress.
    Default sorting: High Priority -> Recommended -> Explore, then highest match_score first.
    Sets is_top_match = True for the single top recommendation.
    """
    projects = await get_all_projects(category=category)

    profile_doc = None
    disc_doc = None
    skill_doc = None
    action_plan_doc = None
    user_progress_list = []

    if db.is_connected and db.db is not None:
        profile_doc = await db.db.profiles.find_one({"user_id": user_id}, {"_id": 0})
        disc_doc = await db.db.discovery_results.find_one({"user_id": user_id}, {"_id": 0})
        skill_doc = await db.db.skill_assessment_results.find_one({"user_id": user_id}, {"_id": 0})
        action_plan_doc = await db.db.career_action_plans.find_one({"user_id": user_id}, {"_id": 0})
        user_progress_list = await db.db.user_project_progress.find({"user_id": user_id}, {"_id": 0}).to_list(length=100)
    else:
        profile_doc = in_memory_store.get("profiles", {}).get(user_id)
        disc_doc = in_memory_store.get("discovery_results", {}).get(user_id)
        skill_doc = in_memory_store.get("skill_assessment_results", {}).get(user_id)
        action_plan_doc = in_memory_store.get("career_action_plans", {}).get(user_id)
        prog_store = in_memory_store.get("user_project_progress", {})
        user_progress_list = [v for k, v in prog_store.items() if k.startswith(f"{user_id}_")]

    progress_map = {p_prog.get("project_id"): p_prog for p_prog in user_progress_list}

    if action_plan_doc and action_plan_doc.get("progress"):
        for p_id, status_val in action_plan_doc["progress"].items():
            if p_id not in progress_map:
                progress_map[p_id] = {
                    "user_id": user_id,
                    "project_id": p_id,
                    "status": status_val,
                    "progress_percentage": 100 if status_val == "Completed" else (50 if status_val == "In Progress" else 0)
                }

    current_skills = set(s.lower() for s in (profile_doc.get("current_skills", []) if profile_doc else []))
    target_career_title = "Full Stack Software Engineer"
    target_career_category = profile_doc.get("preferred_category", "IT") if profile_doc else "IT"
    suitability_score = 75.0

    skill_gaps = []
    if action_plan_doc:
        target_career_title = action_plan_doc.get("target_career_title", target_career_title)
        target_career_category = action_plan_doc.get("target_career_category", target_career_category)
        suitability_score = float(action_plan_doc.get("suitability_score", 75.0))
        skill_gaps = [sg.get("skill_name", "") for sg in action_plan_doc.get("skill_gaps", []) if sg.get("status") in ["Missing", "Needs Improvement"]]
    else:
        rec_res = await calculate_personalized_recommendations(
            user_id=user_id,
            profile_doc=profile_doc,
            discovery_doc=disc_doc,
            skill_assessment_doc=skill_doc
        )
        top_rec = rec_res.get("recommendations", [{}])[0]
        if top_rec:
            target_career_title = top_rec.get("title", target_career_title)
            target_career_category = top_rec.get("category", target_career_category)
            suitability_score = float(top_rec.get("suitability_score", 75.0))
            skill_gaps = [sg.get("skill_name", "") for sg in top_rec.get("skill_gaps", [])]

    if not skill_gaps and profile_doc:
        skill_gaps = ["React", "Python", "SQL", "Machine Learning"]

    user_skill_scores = {}
    if skill_doc:
        for sk in skill_doc.get("strong_skills", []):
            user_skill_scores[sk.lower()] = 80
        for sk in skill_doc.get("weak_skills", []):
            user_skill_scores[sk.lower()] = 35
        if skill_doc.get("score_by_skill"):
            for k, v in skill_doc["score_by_skill"].items():
                user_skill_scores[k.lower()] = int(v)

    recommended_list = []
    for proj in projects:
        p_id = normalize_project_id(proj)
        
        scoring = calculate_project_match_score(
            proj=proj,
            target_career_title=target_career_title,
            target_career_category=target_career_category,
            current_skills=current_skills,
            skill_gaps=skill_gaps,
            suitability_score=suitability_score,
            user_skill_scores=user_skill_scores
        )

        user_prog = progress_map.get(p_id, {})
        status_val = user_prog.get("status", proj.get("status", "Not Started"))
        prog_pct = user_prog.get("progress_percentage", 100 if status_val == "Completed" else (50 if status_val == "In Progress" else 0))
        completed_m = user_prog.get("completed_milestones", [])

        raw_roadmap = proj.get("roadmap", [])
        hydrated_roadmap = []
        for m in raw_roadmap:
            m_copy = m.copy()
            m_copy["completed"] = m.get("id") in completed_m or (status_val == "Completed")
            hydrated_roadmap.append(m_copy)

        proj_rec = {
            **proj,
            "id": p_id,
            "project_id": p_id,
            "recommendation_score": scoring["match_score"],
            "match_score": scoring["match_score"],
            "priority": scoring["priority"],
            "reason": scoring["reason"],
            "matching_skills": scoring["matching_skills"],
            "skill_gaps_addressed": scoring["skill_gaps_addressed"],
            "skills_you_will_improve": scoring["skills_you_will_improve"],
            "skills_to_practice": scoring["skill_gaps_addressed"] or proj.get("skills_covered", [])[:3],
            "match_score_breakdown": scoring["match_score_breakdown"],
            "roadmap": hydrated_roadmap,
            "completed_milestones": completed_m,
            "status": status_val,
            "progress_percentage": prog_pct,
            "deliverables": proj.get("deliverables", []),
            "github_url": user_prog.get("github_url"),
            "live_demo_url": user_prog.get("live_demo_url"),
            "documentation_url": user_prog.get("documentation_url"),
            "is_top_match": False,
            "started_at": user_prog.get("started_at"),
            "completed_at": user_prog.get("completed_at"),
            "updated_at": user_prog.get("updated_at")
        }
        recommended_list.append(proj_rec)

    # Sort by priority tier first (High Priority -> Recommended -> Explore), then match_score descending
    priority_order = {"High Priority": 1, "Recommended": 2, "Explore": 3}
    recommended_list.sort(key=lambda x: (priority_order.get(x["priority"], 4), -x["recommendation_score"]))

    # Single Top Match indicator for highest scoring item (Requirement 7)
    if recommended_list:
        recommended_list[0]["is_top_match"] = True

    return recommended_list

async def get_project_by_id(project_id: str, user_id: Optional[str] = None) -> Dict[str, Any]:
    """Get single project by ID with user progress and hydrated roadmap attached."""
    projects = await fetch_master_projects()
    matched_proj = None
    for p in projects:
        if normalize_project_id(p) == project_id or p.get("id") == project_id or p.get("project_id") == project_id:
            matched_proj = p
            break

    if not matched_proj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found."
        )

    result_proj = matched_proj.copy()
    p_id = normalize_project_id(matched_proj)
    result_proj["id"] = p_id
    result_proj["project_id"] = p_id

    if user_id:
        user_prog = await get_user_project_progress(user_id=user_id, project_id=p_id)
        result_proj["status"] = user_prog.get("status", "Not Started")
        result_proj["progress_percentage"] = user_prog.get("progress_percentage", 0)
        result_proj["completed_milestones"] = user_prog.get("completed_milestones", [])
        result_proj["github_url"] = user_prog.get("github_url")
        result_proj["live_demo_url"] = user_prog.get("live_demo_url")
        result_proj["documentation_url"] = user_prog.get("documentation_url")
        result_proj["started_at"] = user_prog.get("started_at")
        result_proj["completed_at"] = user_prog.get("completed_at")
        result_proj["updated_at"] = user_prog.get("updated_at")

        completed_m = user_prog.get("completed_milestones", [])
        hydrated_roadmap = []
        for m in result_proj.get("roadmap", []):
            m_copy = m.copy()
            m_copy["completed"] = m.get("id") in completed_m or (result_proj["status"] == "Completed")
            hydrated_roadmap.append(m_copy)
        result_proj["roadmap"] = hydrated_roadmap
    else:
        result_proj["status"] = result_proj.get("status", "Not Started")
        result_proj["progress_percentage"] = 0
        result_proj["completed_milestones"] = []

    return result_proj

async def get_user_project_progress(user_id: str, project_id: str) -> Dict[str, Any]:
    """Get user's progress for a specific project."""
    prog_doc = None
    if db.is_connected and db.db is not None:
        prog_doc = await db.db.user_project_progress.find_one(
            {"user_id": user_id, "project_id": project_id},
            {"_id": 0}
        )
    else:
        key = f"{user_id}_{project_id}"
        prog_doc = in_memory_store.get("user_project_progress", {}).get(key)

    if not prog_doc:
        return {
            "user_id": user_id,
            "project_id": project_id,
            "status": "Not Started",
            "progress_percentage": 0,
            "completed_milestones": [],
            "github_url": None,
            "live_demo_url": None,
            "documentation_url": None,
            "started_at": None,
            "completed_at": None,
            "updated_at": None
        }
    return prog_doc

async def update_user_project_progress(
    user_id: str,
    project_id: str,
    status_value: Optional[str] = None,
    progress_percentage: Optional[int] = None,
    completed_milestones: Optional[List[str]] = None,
    github_url: Optional[str] = None,
    live_demo_url: Optional[str] = None,
    documentation_url: Optional[str] = None
) -> Dict[str, Any]:
    """
    Update project progress with milestone tracking, URL persistence, auto status sync.
    Recalculates Phase 6 Action Plan portfolio readiness automatically.
    """
    proj = await get_project_by_id(project_id)
    existing_prog = await get_user_project_progress(user_id=user_id, project_id=project_id)
    now_iso = datetime.now(timezone.utc).isoformat()

    roadmap = proj.get("roadmap", [])
    total_milestones = max(1, len(roadmap))

    cur_completed_milestones = list(existing_prog.get("completed_milestones", []))
    if completed_milestones is not None:
        cur_completed_milestones = completed_milestones

    if completed_milestones is not None:
        final_pct = round((len(cur_completed_milestones) / total_milestones) * 100)
        final_pct = min(100, max(0, final_pct))
        if final_pct == 0:
            final_status = "Not Started"
        elif final_pct == 100:
            final_status = "Completed"
        else:
            final_status = "In Progress"
    elif status_value is not None:
        if status_value not in VALID_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status '{status_value}'. Allowed statuses: {', '.join(VALID_STATUSES)}."
            )
        final_status = status_value
        if final_status == "Completed":
            final_pct = 100
            cur_completed_milestones = [m.get("id") for m in roadmap if m.get("id")]
        elif final_status == "Not Started":
            final_pct = 0
            cur_completed_milestones = []
        else:
            if progress_percentage is not None:
                final_pct = int(progress_percentage)
            else:
                final_pct = existing_prog.get("progress_percentage", 50)
                if final_pct == 0 or final_pct == 100:
                    final_pct = 50
    elif progress_percentage is not None:
        final_pct = int(progress_percentage)
        if final_pct == 0:
            final_status = "Not Started"
        elif final_pct == 100:
            final_status = "Completed"
        else:
            final_status = "In Progress"
    else:
        final_status = existing_prog.get("status", "Not Started")
        final_pct = existing_prog.get("progress_percentage", 0)

    if final_pct < 0 or final_pct > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="progress_percentage must be between 0 and 100."
        )

    started_at = existing_prog.get("started_at")
    completed_at = existing_prog.get("completed_at")

    if final_status == "Completed":
        completed_at = completed_at or now_iso
        started_at = started_at or now_iso
    elif final_status == "In Progress":
        started_at = started_at or now_iso
        completed_at = None
    else:
        started_at = None
        completed_at = None

    updated_prog = {
        "user_id": user_id,
        "project_id": project_id,
        "status": final_status,
        "progress_percentage": final_pct,
        "completed_milestones": cur_completed_milestones,
        "github_url": github_url if github_url is not None else existing_prog.get("github_url"),
        "live_demo_url": live_demo_url if live_demo_url is not None else existing_prog.get("live_demo_url"),
        "documentation_url": documentation_url if documentation_url is not None else existing_prog.get("documentation_url"),
        "started_at": started_at,
        "completed_at": completed_at,
        "updated_at": now_iso
    }

    if db.is_connected and db.db is not None:
        await db.db.user_project_progress.update_one(
            {"user_id": user_id, "project_id": project_id},
            {"$set": updated_prog},
            upsert=True
        )
    else:
        if "user_project_progress" not in in_memory_store:
            in_memory_store["user_project_progress"] = {}
        key = f"{user_id}_{project_id}"
        in_memory_store["user_project_progress"][key] = updated_prog

    # Sync with Phase 6 Action Plan
    try:
        from app.services.action_plan_service import update_action_plan_progress
        await update_action_plan_progress(
            user_id=user_id,
            item_id=project_id,
            item_type="project",
            status_value=final_status
        )
    except Exception as e:
        logger.warning(f"Action plan sync warning for project '{project_id}': {e}")

    portfolio_readiness = await calculate_portfolio_readiness(user_id=user_id)
    return {
        "success": True,
        "message": f"Project '{project_id}' updated to '{final_status}' ({final_pct}%).",
        "progress": updated_prog,
        "portfolio_readiness": portfolio_readiness
    }

async def toggle_project_milestone(user_id: str, project_id: str, milestone_id: str) -> Dict[str, Any]:
    """Toggle completion state of a single project milestone."""
    proj = await get_project_by_id(project_id)
    existing_prog = await get_user_project_progress(user_id=user_id, project_id=project_id)
    completed_m = list(existing_prog.get("completed_milestones", []))

    if milestone_id in completed_m:
        completed_m.remove(milestone_id)
    else:
        completed_m.append(milestone_id)

    return await update_user_project_progress(
        user_id=user_id,
        project_id=project_id,
        completed_milestones=completed_m
    )

async def start_user_project(user_id: str, project_id: str) -> Dict[str, Any]:
    """Start a project (status='In Progress', progress_percentage=0)."""
    return await update_user_project_progress(
        user_id=user_id,
        project_id=project_id,
        status_value="In Progress",
        progress_percentage=0
    )

async def complete_user_project(user_id: str, project_id: str) -> Dict[str, Any]:
    """Mark project as completed (status='Completed', progress_percentage=100)."""
    return await update_user_project_progress(
        user_id=user_id,
        project_id=project_id,
        status_value="Completed",
        progress_percentage=100
    )

async def calculate_portfolio_readiness(user_id: str) -> float:
    """
    Weighted Portfolio Readiness calculation:
    Evaluates top recommended projects by target career relevance and milestone completion.
    """
    recommended = await get_personalized_project_recommendations(user_id=user_id)
    if not recommended:
        return 0.0

    top_recs = recommended[:4]
    weighted_progress_sum = 0.0
    total_weight = 0.0

    for r in top_recs:
        weight = float(r.get("recommendation_score", 50.0))
        prog_pct = float(r.get("progress_percentage", 0.0))
        weighted_progress_sum += (prog_pct * weight)
        total_weight += weight

    if total_weight == 0:
        return 0.0

    readiness = round(weighted_progress_sum / total_weight, 1)
    return min(100.0, max(0.0, readiness))
