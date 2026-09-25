import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.database import db, in_memory_store
from app.core.security import get_current_user
from app.models.profile import UserProfile, UserProfileCreate, UserProfileUpdate

router = APIRouter(prefix="/profile", tags=["User Profiles"])

@router.get("/me", response_model=UserProfile, summary="Get current logged-in user profile")
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]

    if db.is_connected and db.db is not None:
        profile_doc = await db.db.profiles.find_one({"user_id": user_id}, {"_id": 0})
    else:
        profile_doc = in_memory_store.get("profiles", {}).get(user_id)

    if not profile_doc:
        # Create initial profile document if not found
        now_iso = datetime.now(timezone.utc).isoformat()
        profile_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "full_name": current_user.get("full_name", ""),
            "email": current_user.get("email", ""),
            "education_level": "Bachelor's Degree",
            "degree": "B.Tech / B.E.",
            "branch": "Computer Science",
            "graduation_year": 2026,
            "current_skills": ["Python", "JavaScript"],
            "interests": ["Software Engineering"],
            "preferred_category": "IT",
            "updated_at": now_iso
        }
        if db.is_connected and db.db is not None:
            await db.db.profiles.insert_one(profile_doc)
        else:
            in_memory_store["profiles"][user_id] = profile_doc

    return UserProfile(**profile_doc)

@router.post("", response_model=UserProfile, summary="Save or initialize profile for current user")
async def save_profile(profile_in: UserProfileCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    now_iso = datetime.now(timezone.utc).isoformat()

    profile_dict = profile_in.model_dump()
    profile_dict["user_id"] = user_id
    profile_dict["updated_at"] = now_iso

    if db.is_connected and db.db is not None:
        existing = await db.db.profiles.find_one({"user_id": user_id})
        if existing:
            await db.db.profiles.update_one({"user_id": user_id}, {"$set": profile_dict})
            profile_dict["id"] = str(existing.get("id", existing.get("_id", str(uuid.uuid4()))))
        else:
            new_id = str(uuid.uuid4())
            profile_dict["id"] = new_id
            db_doc = profile_dict.copy()
            db_doc["_id"] = new_id
            await db.db.profiles.insert_one(db_doc)
    else:
        profile_dict["id"] = str(uuid.uuid4())
        in_memory_store["profiles"][user_id] = profile_dict

    return UserProfile(**profile_dict)

@router.put("/me", response_model=UserProfile, summary="Update current user profile")
async def update_my_profile(profile_in: UserProfileUpdate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    now_iso = datetime.now(timezone.utc).isoformat()

    update_fields = {k: v for k, v in profile_in.model_dump(exclude_unset=True).items() if v is not None}
    update_fields["updated_at"] = now_iso

    if db.is_connected and db.db is not None:
        existing = await db.db.profiles.find_one({"user_id": user_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Profile not found for current user.")
        await db.db.profiles.update_one({"user_id": user_id}, {"$set": update_fields})
        updated = await db.db.profiles.find_one({"user_id": user_id}, {"_id": 0})
        return UserProfile(**updated)
    else:
        existing = in_memory_store.get("profiles", {}).get(user_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Profile not found for current user.")
        existing.update(update_fields)
        return UserProfile(**existing)

@router.get("/{target_id}", response_model=UserProfile, summary="Get profile by user ID (User isolation protected)")
async def get_profile_by_id(target_id: str, current_user: dict = Depends(get_current_user)):
    # User isolation check: Users can only query their own profile
    if current_user["id"] != target_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You can only view your own profile."
        )

    if db.is_connected and db.db is not None:
        profile_doc = await db.db.profiles.find_one({"user_id": target_id}, {"_id": 0})
    else:
        profile_doc = in_memory_store.get("profiles", {}).get(target_id)

    if not profile_doc:
        raise HTTPException(status_code=404, detail="Profile not found.")

    return UserProfile(**profile_doc)
