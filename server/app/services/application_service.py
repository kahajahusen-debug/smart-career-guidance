import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from app.core.database import db, in_memory_store
from app.services.job_recommendation_service import get_job_by_id_raw

logger = logging.getLogger("uvicorn")

VALID_APPLICATION_STATUSES = [
    "Saved",
    "Applied",
    "Assessment",
    "Interview",
    "Offer",
    "Rejected",
    "Withdrawn"
]

def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

# ==================== SAVED JOBS ====================

async def save_job_for_user(user_id: str, job_id: str) -> Dict[str, Any]:
    job = await get_job_by_id_raw(job_id)
    if not job:
        raise ValueError(f"Job with ID '{job_id}' does not exist.")

    now = utc_now_iso()
    saved_doc = {
        "user_id": user_id,
        "job_id": job_id,
        "saved_at": now
    }

    if db.is_connected and db.db is not None:
        await db.db.saved_jobs.update_one(
            {"user_id": user_id, "job_id": job_id},
            {"$setOnInsert": saved_doc},
            upsert=True
        )
    else:
        saved_list = in_memory_store.get("saved_jobs", [])
        already_saved = any(item for item in saved_list if item.get("user_id") == user_id and item.get("job_id") == job_id)
        if not already_saved:
            saved_list.append(saved_doc)
            in_memory_store["saved_jobs"] = saved_list

    return saved_doc

async def unsave_job_for_user(user_id: str, job_id: str) -> bool:
    if db.is_connected and db.db is not None:
        res = await db.db.saved_jobs.delete_one({"user_id": user_id, "job_id": job_id})
        return res.deleted_count > 0
    else:
        saved_list = in_memory_store.get("saved_jobs", [])
        orig_len = len(saved_list)
        new_list = [item for item in saved_list if not (item.get("user_id") == user_id and item.get("job_id") == job_id)]
        in_memory_store["saved_jobs"] = new_list
        return len(new_list) < orig_len

async def get_saved_job_ids_for_user(user_id: str) -> List[str]:
    if db.is_connected and db.db is not None:
        cursor = db.db.saved_jobs.find({"user_id": user_id}, {"_id": 0})
        docs = await cursor.to_list(length=500)
        return [d["job_id"] for d in docs if "job_id" in d]
    else:
        saved_list = in_memory_store.get("saved_jobs", [])
        return [d["job_id"] for d in saved_list if d.get("user_id") == user_id and "job_id" in d]

# ==================== APPLICATION TRACKING ====================

async def create_application(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    job_id = data.get("job_id")
    if not job_id:
        raise ValueError("job_id is required to create an application tracking record.")

    job = await get_job_by_id_raw(job_id)
    if not job:
        raise ValueError(f"Job with ID '{job_id}' not found.")

    status = data.get("status", "Saved")
    if status not in VALID_APPLICATION_STATUSES:
        raise ValueError(f"Invalid status '{status}'. Must be one of: {', '.join(VALID_APPLICATION_STATUSES)}")

    # Check if application already exists for this user and job
    existing = await get_application_by_user_and_job(user_id, job_id)
    if existing:
        # Update existing
        return await update_application(user_id, existing["application_id"], data)

    app_id = f"app_{uuid.uuid4().hex[:12]}"
    now = utc_now_iso()
    applied_at = data.get("applied_at")
    if status == "Applied" and not applied_at:
        applied_at = now

    app_doc = {
        "application_id": app_id,
        "user_id": user_id,
        "job_id": job_id,
        "job_title": job.get("title", data.get("job_title", "")),
        "company": job.get("company", data.get("company", "")),
        "category": job.get("category", "IT"),
        "location": job.get("location", ""),
        "salary_range": job.get("salary_range") or job.get("stipend") or "",
        "external_url": job.get("external_url", ""),
        "status": status,
        "applied_at": applied_at,
        "notes": data.get("notes", ""),
        "created_at": now,
        "updated_at": now
    }

    if db.is_connected and db.db is not None:
        await db.db.applications.insert_one(app_doc)
        app_doc.pop("_id", None)
    else:
        apps = in_memory_store.get("applications", [])
        apps.append(app_doc)
        in_memory_store["applications"] = apps

    return app_doc

async def get_application_by_user_and_job(user_id: str, job_id: str) -> Optional[Dict[str, Any]]:
    if db.is_connected and db.db is not None:
        doc = await db.db.applications.find_one({"user_id": user_id, "job_id": job_id}, {"_id": 0})
        return doc
    else:
        apps = in_memory_store.get("applications", [])
        for a in apps:
            if a.get("user_id") == user_id and a.get("job_id") == job_id:
                return a
        return None

async def get_applications_for_user(user_id: str) -> List[Dict[str, Any]]:
    if db.is_connected and db.db is not None:
        cursor = db.db.applications.find({"user_id": user_id}, {"_id": 0}).sort("updated_at", -1)
        apps = await cursor.to_list(length=500)
        return apps
    else:
        apps = in_memory_store.get("applications", [])
        user_apps = [a for a in apps if a.get("user_id") == user_id]
        user_apps.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
        return user_apps

async def get_application_by_id(user_id: str, application_id: str) -> Optional[Dict[str, Any]]:
    if db.is_connected and db.db is not None:
        doc = await db.db.applications.find_one({"application_id": application_id, "user_id": user_id}, {"_id": 0})
        return doc
    else:
        apps = in_memory_store.get("applications", [])
        for a in apps:
            if a.get("application_id") == application_id and a.get("user_id") == user_id:
                return a
        return None

async def update_application(user_id: str, application_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
    existing = await get_application_by_id(user_id, application_id)
    if not existing:
        raise KeyError(f"Application with ID '{application_id}' not found for current user.")

    updates = {}
    if "status" in update_data and update_data["status"]:
        new_status = update_data["status"]
        if new_status not in VALID_APPLICATION_STATUSES:
            raise ValueError(f"Invalid status '{new_status}'. Must be one of: {', '.join(VALID_APPLICATION_STATUSES)}")
        updates["status"] = new_status
        if new_status == "Applied" and not existing.get("applied_at"):
            updates["applied_at"] = update_data.get("applied_at") or utc_now_iso()

    if "notes" in update_data and update_data["notes"] is not None:
        updates["notes"] = str(update_data["notes"])

    if "applied_at" in update_data:
        updates["applied_at"] = update_data["applied_at"]

    updates["updated_at"] = utc_now_iso()

    if db.is_connected and db.db is not None:
        await db.db.applications.update_one(
            {"application_id": application_id, "user_id": user_id},
            {"$set": updates}
        )
        updated_doc = await db.db.applications.find_one({"application_id": application_id, "user_id": user_id}, {"_id": 0})
        return updated_doc
    else:
        apps = in_memory_store.get("applications", [])
        for a in apps:
            if a.get("application_id") == application_id and a.get("user_id") == user_id:
                a.update(updates)
                return a
        raise KeyError("Application update failed.")

async def delete_application(user_id: str, application_id: str) -> bool:
    if db.is_connected and db.db is not None:
        res = await db.db.applications.delete_one({"application_id": application_id, "user_id": user_id})
        return res.deleted_count > 0
    else:
        apps = in_memory_store.get("applications", [])
        orig_len = len(apps)
        new_apps = [a for a in apps if not (a.get("application_id") == application_id and a.get("user_id") == user_id)]
        in_memory_store["applications"] = new_apps
        return len(new_apps) < orig_len

async def get_application_stats(user_id: str) -> Dict[str, Any]:
    apps = await get_applications_for_user(user_id)
    counts = {st: 0 for st in VALID_APPLICATION_STATUSES}
    for a in apps:
        st = a.get("status", "Saved")
        if st in counts:
            counts[st] += 1
        else:
            counts["Saved"] += 1

    total = len(apps)
    applied_count = counts["Applied"] + counts["Assessment"] + counts["Interview"] + counts["Offer"]
    interview_count = counts["Interview"] + counts["Offer"]
    offer_count = counts["Offer"]

    applied_pct = round((applied_count / total * 100), 1) if total > 0 else 0.0
    interview_pct = round((interview_count / total * 100), 1) if total > 0 else 0.0
    offer_pct = round((offer_count / total * 100), 1) if total > 0 else 0.0

    return {
        "total": total,
        "saved": counts["Saved"],
        "applied": counts["Applied"],
        "assessments": counts["Assessment"],
        "interviews": counts["Interview"],
        "offers": counts["Offer"],
        "rejected": counts["Rejected"],
        "withdrawn": counts["Withdrawn"],
        "status_counts": counts,
        "progress_percentages": {
            "applied_pct": applied_pct,
            "interview_pct": interview_pct,
            "offer_pct": offer_pct
        }
    }
