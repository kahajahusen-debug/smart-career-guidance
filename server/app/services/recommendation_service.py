import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from app.core.database import db, in_memory_store
from app.db.seeds.seed_data import CAREERS_SEED
from app.models.assessment import (
    SkillGapItem, 
    CareerRecommendationItem, 
    AssessmentResultResponse
)

logger = logging.getLogger("uvicorn")

async def get_all_careers_data() -> List[Dict[str, Any]]:
    if db.is_connected and db.db is not None:
        cursor = db.db.careers.find({}, {"_id": 0})
        careers = await cursor.to_list(length=100)
        if careers:
            return careers
    careers = in_memory_store.get("careers", [])
    if careers:
        return careers
    return CAREERS_SEED

# Helper for fuzzy and alias skill matching
def is_skill_match(req_skill: str, candidate_skill: str) -> bool:
    if not req_skill or not candidate_skill:
        return False
    r = req_skill.strip().lower()
    c = candidate_skill.strip().lower()
    if r == c:
        return True
    if len(r) >= 3 and len(c) >= 3:
        if r in c or c in r:
            return True
    synonyms_map = {
        "machine learning": ["ml", "scikit-learn", "deep learning", "ai"],
        "python": ["python 3", "py", "pandas"],
        "javascript": ["js", "es6", "vanilla js"],
        "react": ["reactjs", "react.js", "frontend"],
        "docker & kubernetes": ["docker", "kubernetes", "k8s", "containers"],
        "linux": ["unix", "bash", "shell scripting", "linux administration"],
        "sql": ["mysql", "postgresql", "postgres", "sqlite", "relational database"],
        "ui/ux design": ["ui", "ux", "ui/ux", "ui design", "ux design", "product design"],
        "figma & wireframing": ["figma", "wireframing", "prototyping"],
        "seo & sem": ["seo", "sem", "google analytics", "digital marketing"],
        "content strategy": ["content marketing", "copywriting"],
        "marketing analytics": ["analytics", "google analytics", "kpis"],
        "statistics": ["prob & stats", "probability", "statistical analysis"],
        "data visualization": ["power bi", "tableau", "matplotlib", "seaborn"],
        "network security": ["networking", "firewall", "cybersecurity"],
        "ethical hacking": ["penetration testing", "pen testing", "vulnerability assessment"],
        "incident response": ["soc", "threat hunting"],
        "cryptography": ["encryption", "security protocols"],
        "ci/cd": ["continuous integration", "github actions", "jenkins"],
        "cloud architecture": ["aws", "azure", "gcp", "cloud computing"],
        "product strategy": ["roadmap", "product management", "rice framework"],
        "user research": ["user testing", "interviews", "personas"],
        "agile & scrum": ["scrum", "agile", "sprints", "jira"],
        "financial analysis": ["financial modeling", "dcf", "valuation", "accounting"],
        "risk assessment": ["risk management", "credit risk", "market risk"],
        "talent acquisition": ["recruitment", "hiring", "sourcing"],
        "employee engagement": ["retention", "hr policies", "onboarding"],
        "healthcare operations": ["hospital administration", "patient workflow"],
        "compliance & regulation": ["hipaa", "nabh", "healthcare regulations"]
    }
    for base, syns in synonyms_map.items():
        if (r == base or r in syns) and (c == base or c in syns):
            return True
    return False

# Career domain affinity weights for Career Discovery alignment
CAREER_DOMAIN_WEIGHTS = {
    "car_it_01": {"technical": 0.85, "data": 0.15},
    "car_it_02": {"data": 0.95, "technical": 0.05},
    "car_it_03": {"technical": 0.90, "data": 0.10},
    "car_it_04": {"design": 0.95, "technical": 0.05},
    "car_it_05": {"technical": 0.65, "data": 0.35},
    "car_nonit_01": {"business": 0.65, "data": 0.35},
    "car_nonit_02": {"business": 0.80, "technical": 0.10, "design": 0.10},
    "car_nonit_03": {"data": 0.75, "business": 0.25},
    "car_nonit_04": {"business": 0.90, "design": 0.10},
    "car_nonit_05": {"business": 0.85, "data": 0.15}
}

async def calculate_personalized_recommendations(
    user_id: str,
    profile_doc: Optional[Dict[str, Any]] = None,
    discovery_doc: Optional[Dict[str, Any]] = None,
    skill_assessment_doc: Optional[Dict[str, Any]] = None,
    category_filter: Optional[str] = None
) -> Dict[str, Any]:
    """
    Phase 5 Dynamic Personalized Career Recommendation Engine.

    GATE: Career matches and compatibility scores are ONLY generated when BOTH
    Career Discovery AND Skill Assessment are completed. If either is missing,
    an empty recommendations list is returned with a clear message.

    Weights (with completed skill assessment):
    - Skill Match: 35%
    - Career Discovery Match: 25%
    - Skill Assessment Match: 20%
    - Education Match: 10%
    - Work Style Match: 10%
    """
    has_discovery = (
        discovery_doc is not None
        and bool(discovery_doc.get("top_areas"))
        and bool(discovery_doc.get("completed", True))  # must have submitted discovery
    )
    has_assessment = (
        skill_assessment_doc is not None
        and skill_assessment_doc.get("overall_accuracy") is not None
        and isinstance(skill_assessment_doc.get("overall_accuracy"), (int, float))
    )
    has_profile = profile_doc is not None and bool(
        profile_doc.get("current_skills") or profile_doc.get("interests")
    )

    # ---------------------------------------------------------------
    # STRICT GATE: Both assessments must be completed to show results
    # ---------------------------------------------------------------
    if not has_discovery or not has_assessment:
        missing_parts = []
        if not has_discovery:
            missing_parts.append("Career Discovery")
        if not has_assessment:
            missing_parts.append("Skill Assessment")
        gate_message = (
            f"Complete your {' and '.join(missing_parts)} to see personalized career matches and compatibility scores."
        )
        return {
            "user_id": user_id,
            "assessment_score": 0,
            "recommendations": [],
            "career_recommendations": [],
            "matched_skills": [],
            "missing_skills": [],
            "recommended_projects": [],
            "has_profile": has_profile,
            "has_discovery": has_discovery,
            "has_assessment": has_assessment,
            "data_completeness": "Incomplete",
            "message": gate_message,
            "assessments_complete": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

    data_completeness = "Complete" if has_profile else "Partial"
    message = "Recommendations dynamically calculated from your complete profile, discovery, and assessment metrics."

    # Extract user attributes
    current_skills_user = [s.strip() for s in (profile_doc.get("current_skills", []) if profile_doc else []) if s.strip()]
    user_interests = [i.strip() for i in (profile_doc.get("interests", []) if profile_doc else []) if i.strip()]
    user_pref_cat = (profile_doc.get("preferred_category", "Both") if profile_doc else "Both").strip().lower()
    user_degree = (profile_doc.get("degree", "") or profile_doc.get("education_level", "") if profile_doc else "").strip().lower()
    user_major = (profile_doc.get("major", "") if profile_doc else "").strip().lower()
    user_work_style = (profile_doc.get("work_style", "") if profile_doc else "").strip().lower()

    # Extract Discovery attributes & domain percentages
    top_disc_areas = []
    disc_percentages = {}
    if discovery_doc:
        disc_percentages = discovery_doc.get("percentages", {})
        if "top_areas" in discovery_doc:
            for ta in discovery_doc["top_areas"]:
                top_disc_areas.append({
                    "area": ta.get("area", "").lower(),
                    "pct": float(ta.get("percentage", 0.0))
                })

    # Normalized domain percentages
    data_pct = float(disc_percentages.get("data", 0.0))
    tech_pct = float(disc_percentages.get("technical", 0.0))
    design_pct = float(disc_percentages.get("design", 0.0))
    biz_pct = float(disc_percentages.get("business", 0.0))

    # Extract Skill Assessment attributes
    ass_accuracy = float(skill_assessment_doc.get("overall_accuracy", 0.0)) if skill_assessment_doc else 0.0
    ass_strong_skills = [s for s in (skill_assessment_doc.get("strong_skills", []) if skill_assessment_doc else [])]
    ass_moderate_skills = [s for s in (skill_assessment_doc.get("moderate_skills", []) if skill_assessment_doc else [])]
    ass_improve_skills = [s for s in (skill_assessment_doc.get("improve_skills", []) if skill_assessment_doc else [])]
    ass_skill_scores = {k: float(v) for k, v in (skill_assessment_doc.get("skill_scores", {}).items() if skill_assessment_doc else {})}

    all_careers = await get_all_careers_data()

    # Fetch projects for portfolio recommendations
    if db.is_connected and db.db is not None:
        p_cursor = db.db.projects.find({}, {"_id": 0})
        all_projects = await p_cursor.to_list(length=100)
    else:
        all_projects = in_memory_store.get("projects", [])

    recommendations_list: List[Dict[str, Any]] = []
    global_matched_skills: set = set()
    global_missing_skills: set = set()

    for car in all_careers:
        car_id = car.get("id", "")
        car_title = car.get("title", "")
        car_category = car.get("category", "")
        car_desc = car.get("description", "")
        required_skills = car.get("required_skills", [])

        # Filter by category if requested
        if category_filter and category_filter.lower() != "all":
            if car_category.lower() != category_filter.lower():
                continue

        # ----------------------------------------------------
        # 1. SKILL MATCH SCORE (35%)
        # ----------------------------------------------------
        car_matching_skills: List[str] = []
        car_missing_skills: List[str] = []
        skill_gap_items: List[Dict[str, Any]] = []

        total_skill_weight = 0.0
        weighted_skill_sum = 0.0

        for req in required_skills:
            sk_name = req.get("skill_name", "")
            target_score = float(req.get("target_score", 75))
            weight = float(req.get("weight", 1.0))
            total_skill_weight += weight

            # Profile skill presence using fuzzy matching
            has_profile_skill = any(is_skill_match(sk_name, s) for s in current_skills_user)
            
            # Assessment score for this skill
            eval_score = 0.0
            matched_in_assessment = False
            for ass_k, ass_v in ass_skill_scores.items():
                if is_skill_match(sk_name, ass_k):
                    eval_score = max(eval_score, ass_v)
                    matched_in_assessment = True
            if not matched_in_assessment:
                if any(is_skill_match(sk_name, s) for s in ass_strong_skills):
                    eval_score = 85.0
                    matched_in_assessment = True
                elif any(is_skill_match(sk_name, s) for s in ass_moderate_skills):
                    eval_score = 65.0
                    matched_in_assessment = True
                elif any(is_skill_match(sk_name, s) for s in ass_improve_skills):
                    eval_score = 40.0
                    matched_in_assessment = True

            # Combined user score calculation
            if has_assessment:
                if matched_in_assessment:
                    user_score = eval_score
                elif has_profile_skill:
                    user_score = 65.0
                else:
                    user_score = 35.0
            else:
                if has_profile_skill:
                    user_score = 75.0
                else:
                    user_score = 30.0

            match_ratio = min(1.0, user_score / target_score) if target_score > 0 else 1.0
            weighted_skill_sum += (match_ratio * weight)

            if user_score >= (target_score * 0.75):
                status_tier = "Strong"
                car_matching_skills.append(sk_name)
                global_matched_skills.add(sk_name)
            elif user_score >= (target_score * 0.60):
                status_tier = "Good"
                car_matching_skills.append(sk_name)
                global_matched_skills.add(sk_name)
            else:
                status_tier = "Improve"
                car_missing_skills.append(sk_name)
                global_missing_skills.add(sk_name)

            skill_gap_items.append({
                "skill_name": sk_name,
                "user_score": user_score,
                "target_score": target_score,
                "status": status_tier
            })

        skill_match_score = round((weighted_skill_sum / total_skill_weight * 100.0), 1) if total_skill_weight > 0 else 50.0

        # ----------------------------------------------------
        # 2. CAREER DISCOVERY / INTEREST MATCH (25% or 35%)
        # ----------------------------------------------------
        if has_discovery and (data_pct > 0 or tech_pct > 0 or design_pct > 0 or biz_pct > 0):
            domain_weights = CAREER_DOMAIN_WEIGHTS.get(car_id, {"technical": 0.5, "data": 0.5})
            raw_interest = (
                (domain_weights.get("data", 0.0) * data_pct) +
                (domain_weights.get("technical", 0.0) * tech_pct) +
                (domain_weights.get("design", 0.0) * design_pct) +
                (domain_weights.get("business", 0.0) * biz_pct)
            )
            # Apply baseline floor so unselected domains don't drop below 25.0
            disc_match_score = max(25.0, min(100.0, raw_interest))
        elif top_disc_areas:
            primary_area = top_disc_areas[0]["area"]
            primary_pct = top_disc_areas[0]["pct"]
            if ("data" in primary_area or "analytics" in primary_area) and any(k in car_title.lower() for k in ["data", "ml", "financial"]):
                disc_match_score = min(100.0, primary_pct + 10.0)
            elif ("technical" in primary_area or "software" in primary_area) and car_category.lower() == "it":
                disc_match_score = min(100.0, primary_pct + 10.0)
            elif ("design" in primary_area or "ux" in primary_area) and any(k in car_title.lower() for k in ["design", "ui/ux"]):
                disc_match_score = min(100.0, primary_pct + 10.0)
            elif ("business" in primary_area or "management" in primary_area) and car_category.lower() == "non-it":
                disc_match_score = min(100.0, primary_pct + 10.0)
            else:
                disc_match_score = 40.0
        else:
            disc_match_score = 50.0

        # Profile Interest keyword boost
        if user_interests:
            search_blob = f"{car_title} {car_category} {car_desc}".lower()
            if any(intr.lower() in search_blob for intr in user_interests):
                disc_match_score = min(100.0, disc_match_score + 15.0)

        disc_match_score = round(max(20.0, min(100.0, disc_match_score)), 1)

        # ----------------------------------------------------
        # 3. SKILL ASSESSMENT MATCH SCORE (20% when present)
        # ----------------------------------------------------
        if has_assessment:
            strong_matches = sum(1 for req in required_skills if any(is_skill_match(req.get("skill_name", ""), s) for s in ass_strong_skills))
            improve_matches = sum(1 for req in required_skills if any(is_skill_match(req.get("skill_name", ""), s) for s in ass_improve_skills))

            assessment_match_score = ass_accuracy + (strong_matches * 6.0) - (improve_matches * 5.0)
            assessment_match_score = round(max(20.0, min(100.0, assessment_match_score)), 1)
        else:
            assessment_match_score = None

        # ----------------------------------------------------
        # 4. EDUCATION MATCH SCORE (10% or 15%)
        # ----------------------------------------------------
        edu_score = 70.0
        combo_edu = f"{user_degree} {user_major}"
        if car_category.lower() == "it":
            if any(w in combo_edu for w in ["computer", "cs", "software", "it", "data", "engineering", "b.tech", "m.tech", "bca", "mca"]):
                edu_score = 95.0
            elif combo_edu.strip():
                edu_score = 75.0
            else:
                edu_score = 70.0
        else:
            if any(w in combo_edu for w in ["business", "marketing", "finance", "management", "mba", "bba", "arts", "commerce", "health"]):
                edu_score = 95.0
            elif combo_edu.strip():
                edu_score = 75.0
            else:
                edu_score = 70.0

        edu_score = round(edu_score, 1)

        # ----------------------------------------------------
        # 5. WORK STYLE MATCH SCORE (10% or 15%)
        # ----------------------------------------------------
        work_style_score = 75.0
        if user_work_style:
            if "analytical" in user_work_style and any(k in car_title.lower() for k in ["data", "engineer", "financial", "analyst"]):
                work_style_score = 95.0
            elif "creative" in user_work_style and any(k in car_title.lower() for k in ["designer", "marketing", "product"]):
                work_style_score = 95.0
            elif "collaborative" in user_work_style and any(k in car_title.lower() for k in ["manager", "hr", "operations"]):
                work_style_score = 90.0

        work_style_score = round(work_style_score, 1)

        # ----------------------------------------------------
        # FINAL SUITABILITY SCORE
        # Formula:
        # If assessment taken: Skill (35%) + Discovery (25%) + Assessment (20%) + Education (10%) + WorkStyle (10%)
        # If assessment pending: Skill (35%) + Discovery (35%) + Education (15%) + WorkStyle (15%)
        # ----------------------------------------------------
        if has_assessment:
            final_score = (
                (skill_match_score * 0.35) +
                (disc_match_score * 0.25) +
                (assessment_match_score * 0.20) +
                (edu_score * 0.10) +
                (work_style_score * 0.10)
            )
        else:
            final_score = (
                (skill_match_score * 0.35) +
                (disc_match_score * 0.35) +
                (edu_score * 0.15) +
                (work_style_score * 0.15)
            )

        final_score = round(max(10.0, min(99.0, final_score)), 1)

        # Build Explainable Reason String
        reasons = []
        if car_matching_skills:
            reasons.append(f"Matching skills in {', '.join(car_matching_skills[:3])}")
        if disc_match_score >= 80.0:
            reasons.append("High Career Discovery interest alignment")
        if has_assessment and assessment_match_score and assessment_match_score >= 75.0:
            reasons.append("Strong technical assessment score")
        elif not has_assessment:
            reasons.append("Technical skill assessment pending")
        if edu_score >= 85.0:
            reasons.append("Compatible educational background")

        reason_str = ". ".join(reasons) + "." if reasons else "Your skill profile and preferences align with this career pathway."

        # Filter projects for this career
        car_projects = [
            p for p in all_projects 
            if any(s.lower() in [r.get("skill_name","").lower() for r in required_skills] for s in p.get("skills_covered", []))
        ]
        if not car_projects:
            car_projects = all_projects[:2]

        recommendations_list.append({
            "career_id": car_id,
            "title": car_title,
            "category": car_category,
            "suitability_score": final_score,
            "description": car_desc,
            "matching_skills": car_matching_skills,
            "missing_skills": car_missing_skills,
            "required_skills": [r.get("skill_name", "") if isinstance(r, dict) else str(r) for r in required_skills],
            "skill_gaps": skill_gap_items,
            "interest_match": disc_match_score,
            "skill_match": skill_match_score,
            "assessment_match": assessment_match_score,
            "education_match": edu_score,
            "work_style_match": work_style_score,
            "is_assessment_pending": not has_assessment,
            "reason": reason_str,
            "average_salary": car.get("average_salary", "N/A"),
            "growth_rate": car.get("growth_rate", "N/A"),
            "common_roles": car.get("common_roles", []),
            "entry_requirements": car.get("entry_requirements", ""),
            "recommended_projects": car_projects[:2]
        })

    # Sort recommendations by suitability_score descending
    recommendations_list.sort(key=lambda x: x["suitability_score"], reverse=True)

    # Global portfolio project recommendations
    global_top_missing = list(global_missing_skills)
    global_projects = []
    for p in all_projects:
        p_skills = [s.lower() for s in p.get("skills_covered", [])]
        if any(ms.lower() in p_skills for ms in global_top_missing) or len(global_projects) < 2:
            global_projects.append(p)
    if not global_projects:
        global_projects = all_projects[:3]

    top_score = recommendations_list[0]["suitability_score"] if recommendations_list else 75.0

    return {
        "user_id": user_id,
        "assessment_score": ass_accuracy,
        "recommendations": recommendations_list,
        "career_recommendations": recommendations_list, # Backward compatibility alias
        "matched_skills": list(global_matched_skills),
        "missing_skills": list(global_missing_skills),
        "recommended_projects": global_projects,
        "has_profile": has_profile,
        "has_discovery": has_discovery,
        "has_assessment": has_assessment,
        "assessments_complete": True,
        "data_completeness": data_completeness,
        "message": message,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
