import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from fastapi import HTTPException, status
from app.core.database import db, in_memory_store
from app.services.recommendation_service import calculate_personalized_recommendations, get_all_careers_data

logger = logging.getLogger("uvicorn")

VALID_STATUSES = ["Not Started", "In Progress", "Completed"]

async def get_or_create_action_plan(
    user_id: str,
    target_career_id: Optional[str] = None,
    force_rebuild: bool = False
) -> Dict[str, Any]:
    """
    Phase 6 Career Action Plan Service.
    Calculates dynamic skill gaps, prioritized learning roadmap, recommended projects,
    job readiness score, and overall progress percentage.
    """
    # Check for existing action plan doc
    existing_doc = None
    if not force_rebuild and not target_career_id:
        if db.is_connected and db.db is not None:
            existing_doc = await db.db.career_action_plans.find_one({"user_id": user_id}, {"_id": 0})
        else:
            existing_doc = in_memory_store.get("career_action_plans", {}).get(user_id)

    if existing_doc and not force_rebuild and not target_career_id:
        return existing_doc

    # Fetch user data & recommendations
    if db.is_connected and db.db is not None:
        profile_doc = await db.db.profiles.find_one({"user_id": user_id}, {"_id": 0})
        disc_doc = await db.db.discovery_results.find_one({"user_id": user_id}, {"_id": 0})
        skill_doc = await db.db.skill_assessment_results.find_one({"user_id": user_id}, {"_id": 0})
        all_projects = await db.db.projects.find({}, {"_id": 0}).to_list(length=100)
    else:
        profile_doc = in_memory_store.get("profiles", {}).get(user_id)
        disc_doc = in_memory_store.get("discovery_results", {}).get(user_id)
        skill_doc = in_memory_store.get("skill_assessment_results", {}).get(user_id)
        all_projects = in_memory_store.get("projects", [])

    rec_res = await calculate_personalized_recommendations(
        user_id=user_id,
        profile_doc=profile_doc,
        discovery_doc=disc_doc,
        skill_assessment_doc=skill_doc
    )

    recommendations = rec_res.get("recommendations", [])
    if not recommendations:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No career recommendations found to generate an action plan."
        )

    # Determine Target Career
    if target_career_id:
        target_rec = next((r for r in recommendations if r.get("career_id") == target_career_id), None)
        if not target_rec:
            # Check if valid in master careers list
            all_careers = await get_all_careers_data()
            master_car = next((c for c in all_careers if c.get("id") == target_career_id), None)
            if not master_car:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Target career ID '{target_career_id}' not found."
                )
            target_rec = {
                "career_id": master_car["id"],
                "title": master_car["title"],
                "category": master_car["category"],
                "suitability_score": 75.0,
                "description": master_car.get("description", ""),
                "matching_skills": [],
                "missing_skills": [r.get("skill_name") for r in master_car.get("required_skills", [])],
                "skill_gaps": []
            }
    else:
        target_rec = recommendations[0]

    # Existing progress map if rebuilding
    existing_progress = existing_doc.get("progress", {}) if existing_doc else {}

    # 1. Skill Gap Analysis & Learning Roadmap
    skill_gaps: List[Dict[str, Any]] = []
    roadmap: List[Dict[str, Any]] = []

    req_gaps = target_rec.get("skill_gaps", [])
    if not req_gaps:
        # Fallback build from required_skills if empty
        all_careers = await get_all_careers_data()
        c_obj = next((c for c in all_careers if c.get("id") == target_rec["career_id"]), None)
        if c_obj:
            req_gaps = [
                {
                    "skill_name": r.get("skill_name"),
                    "user_score": 35.0,
                    "target_score": float(r.get("target_score", 75)),
                    "status": "Improve"
                }
                for r in c_obj.get("required_skills", [])
            ]

    for sg in req_gaps:
        sk_name = sg.get("skill_name", "")
        sk_id = f"sk_{sk_name.lower().replace(' ', '_').replace('&', 'and')}"
        user_sc = float(sg.get("user_score", 40.0))
        target_sc = float(sg.get("target_score", 80.0))
        gap_pct = round(max(0.0, target_sc - user_sc), 1)

        # Status
        if user_sc >= (target_sc * 0.88):
            tier_status = "Strong"
        elif user_sc >= (target_sc * 0.65):
            tier_status = "Moderate"
        elif user_sc >= 35.0:
            tier_status = "Needs Improvement"
        else:
            tier_status = "Missing"

        skill_gaps.append({
            "skill_id": sk_id,
            "skill_name": sk_name,
            "required_level": target_sc,
            "current_level": user_sc,
            "gap": gap_pct,
            "status": tier_status
        })

        # Priority
        if gap_pct >= 30.0 or tier_status == "Missing":
            prio = "High"
            dur = "3-4 Weeks"
        elif gap_pct >= 15.0 or tier_status == "Needs Improvement":
            prio = "Medium"
            dur = "2 Weeks"
        else:
            prio = "Low"
            dur = "1 Week"

        item_progress = existing_progress.get(sk_id, "Completed" if tier_status == "Strong" else "Not Started")

        roadmap.append({
            "skill_id": sk_id,
            "skill_name": sk_name,
            "priority": prio,
            "current_level": user_sc,
            "target_level": target_sc,
            "gap_percentage": gap_pct,
            "recommended_duration": dur,
            "status": item_progress,
            "suggested_resources": f"Interactive {sk_name} Tutorials, Hands-on Exercises & Problem Sets"
        })

    # Sort roadmap by priority (High -> Medium -> Low)
    prio_order = {"High": 1, "Medium": 2, "Low": 3}
    roadmap.sort(key=lambda x: prio_order.get(x["priority"], 4))

    # 2. Recommended Projects Roadmap
    recommended_projects: List[Dict[str, Any]] = []
    top_gaps = [sg["skill_name"].lower() for sg in skill_gaps if sg["status"] in ["Needs Improvement", "Missing"]]
    
    for p in all_projects:
        p_id = p.get("id", f"proj_{len(recommended_projects)+1}")
        p_skills = [s.lower() for s in p.get("skills_covered", [])]

        if any(g in p_skills for g in top_gaps) or len(recommended_projects) < 2:
            p_progress = existing_progress.get(p_id, "Not Started")
            
            matched_gaps = [g for g in top_gaps if g in p_skills]
            if matched_gaps:
                reason = f"Recommended because {', '.join([m.title() for m in matched_gaps])} are key skill gaps for {target_rec['title']}."
            else:
                reason = f"Practices essential core skills for {target_rec['title']}."

            recommended_projects.append({
                "project_id": p_id,
                "title": p.get("title") or p.get("project_name", "Portfolio Project"),
                "description": p.get("description", ""),
                "skills_covered": p.get("skills_covered", []),
                "difficulty": p.get("difficulty", "Intermediate"),
                "reason": reason,
                "status": p_progress
            })

    if not recommended_projects and all_projects:
        for p in all_projects[:3]:
            p_id = p.get("id", "proj_default")
            recommended_projects.append({
                "project_id": p_id,
                "title": p.get("title", "Portfolio Project"),
                "description": p.get("description", ""),
                "skills_covered": p.get("skills_covered", []),
                "difficulty": p.get("difficulty", "Intermediate"),
                "reason": f"Builds core portfolio proof for {target_rec['title']}.",
                "status": existing_progress.get(p_id, "Not Started")
            })

    # 3. Job Readiness Calculation
    completed_skills_cnt = sum(1 for item in roadmap if item["status"] == "Completed")
    completed_projs_cnt = sum(1 for item in recommended_projects if item["status"] == "Completed")

    profile_ready_pct = 100.0 if profile_doc and profile_doc.get("current_skills") else 60.0
    skills_ready_pct = min(100.0, round((completed_skills_cnt / max(1, len(roadmap))) * 100.0 + (rec_res.get("assessment_score", 50.0) * 0.4), 1))
    portfolio_ready_pct = min(100.0, round((completed_projs_cnt / max(1, len(recommended_projects))) * 100.0 + 40.0, 1))
    career_ready_pct = float(target_rec.get("suitability_score", 75.0))

    readiness_score = round(
        (skills_ready_pct * 0.35) + 
        (career_ready_pct * 0.30) + 
        (portfolio_ready_pct * 0.20) + 
        (profile_ready_pct * 0.15), 
        1
    )

    readiness_breakdown = {
        "profile_ready": profile_ready_pct >= 75.0,
        "skills_ready": skills_ready_pct >= 70.0,
        "portfolio_ready": portfolio_ready_pct >= 60.0,
        "career_ready": career_ready_pct >= 75.0,
        "profile_ready_pct": profile_ready_pct,
        "skills_ready_pct": skills_ready_pct,
        "portfolio_ready_pct": portfolio_ready_pct,
        "career_ready_pct": career_ready_pct
    }

    # 4. Overall Progress Calculation
    total_items = len(roadmap) + len(recommended_projects)
    completed_total = completed_skills_cnt + completed_projs_cnt
    overall_progress_pct = round((completed_total / max(1, total_items)) * 100.0, 1)

    now_iso = datetime.now(timezone.utc).isoformat()
    doc_id = str(uuid.uuid4())

    # Build Progress map
    progress_map = existing_progress.copy()
    for rm in roadmap:
        progress_map[rm["skill_id"]] = rm["status"]
    for pr in recommended_projects:
        progress_map[pr["project_id"]] = pr["status"]

    action_plan_doc = {
        "id": doc_id,
        "user_id": user_id,
        "target_career_id": target_rec["career_id"],
        "target_career_title": target_rec["title"],
        "target_career_category": target_rec["category"],
        "suitability_score": target_rec["suitability_score"],
        "readiness_score": readiness_score,
        "readiness_breakdown": readiness_breakdown,
        "skill_gaps": skill_gaps,
        "roadmap": roadmap,
        "recommended_projects": recommended_projects,
        "progress": progress_map,
        "overall_progress_pct": overall_progress_pct,
        "created_at": existing_doc.get("created_at") if existing_doc else now_iso,
        "updated_at": now_iso
    }

    # Save to MongoDB or in-memory
    if db.is_connected and db.db is not None:
        db_doc = action_plan_doc.copy()
        db_doc["_id"] = doc_id
        await db.db.career_action_plans.delete_many({"user_id": user_id})
        await db.db.career_action_plans.insert_one(db_doc)
    else:
        in_memory_store["career_action_plans"][user_id] = action_plan_doc

    return action_plan_doc

async def update_action_plan_progress(
    user_id: str,
    item_id: str,
    item_type: str,
    status_value: str
) -> Dict[str, Any]:
    """
    Updates skill or project progress status and recalculates overall roadmap progress.
    """
    if status_value not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid progress status '{status_value}'. Must be one of: {', '.join(VALID_STATUSES)}."
        )

    action_plan = await get_or_create_action_plan(user_id)

    # Update item in roadmap or recommended_projects
    item_found = False
    if item_type.lower() in ["skill", "roadmap"]:
        for item in action_plan.get("roadmap", []):
            if item.get("skill_id") == item_id or item.get("skill_name").lower() == item_id.lower():
                item["status"] = status_value
                action_plan["progress"][item["skill_id"]] = status_value
                item_found = True
                break
    elif item_type.lower() in ["project", "projects"]:
        for proj in action_plan.get("recommended_projects", []):
            if proj.get("project_id") == item_id:
                proj["status"] = status_value
                action_plan["progress"][proj["project_id"]] = status_value
                item_found = True
                break

    if not item_found:
        # Fallback check across both lists
        for item in action_plan.get("roadmap", []):
            if item.get("skill_id") == item_id:
                item["status"] = status_value
                action_plan["progress"][item["skill_id"]] = status_value
                item_found = True
                break
        if not item_found:
            for proj in action_plan.get("recommended_projects", []):
                if proj.get("project_id") == item_id:
                    proj["status"] = status_value
                    action_plan["progress"][proj["project_id"]] = status_value
                    item_found = True
                    break

    if not item_found:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Item ID '{item_id}' not found in career action plan roadmap."
        )

    # Recalculate progress metrics
    roadmap = action_plan.get("roadmap", [])
    recommended_projects = action_plan.get("recommended_projects", [])

    completed_skills = sum(1 for rm in roadmap if rm.get("status") == "Completed")
    completed_projects = sum(1 for pr in recommended_projects if pr.get("status") == "Completed")

    total_items = len(roadmap) + len(recommended_projects)
    completed_total = completed_skills + completed_projects
    overall_progress_pct = round((completed_total / max(1, total_items)) * 100.0, 1)

    # Recalculate readiness
    profile_ready_pct = action_plan.get("readiness_breakdown", {}).get("profile_ready_pct", 75.0)
    career_ready_pct = action_plan.get("readiness_breakdown", {}).get("career_ready_pct", 75.0)
    skills_ready_pct = min(100.0, round((completed_skills / max(1, len(roadmap))) * 100.0 + 35.0, 1))
    portfolio_ready_pct = min(100.0, round((completed_projects / max(1, len(recommended_projects))) * 100.0 + 40.0, 1))

    new_readiness_score = round(
        (skills_ready_pct * 0.35) + 
        (career_ready_pct * 0.30) + 
        (portfolio_ready_pct * 0.20) + 
        (profile_ready_pct * 0.15), 
        1
    )

    action_plan["overall_progress_pct"] = overall_progress_pct
    action_plan["readiness_score"] = new_readiness_score
    action_plan["readiness_breakdown"]["skills_ready_pct"] = skills_ready_pct
    action_plan["readiness_breakdown"]["portfolio_ready_pct"] = portfolio_ready_pct
    action_plan["readiness_breakdown"]["skills_ready"] = skills_ready_pct >= 70.0
    action_plan["readiness_breakdown"]["portfolio_ready"] = portfolio_ready_pct >= 60.0
    action_plan["updated_at"] = datetime.now(timezone.utc).isoformat()

    # Save to MongoDB or in-memory
    if db.is_connected and db.db is not None:
        doc_id = action_plan.get("id", str(uuid.uuid4()))
        db_doc = action_plan.copy()
        db_doc["_id"] = doc_id
        await db.db.career_action_plans.delete_many({"user_id": user_id})
        await db.db.career_action_plans.insert_one(db_doc)
    else:
        in_memory_store["career_action_plans"][user_id] = action_plan

    return action_plan
