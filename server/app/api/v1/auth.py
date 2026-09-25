import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends
from pymongo.errors import DuplicateKeyError

from app.core.database import db, in_memory_store
from app.core.security import hash_password, verify_password, create_access_token, get_current_user
from app.models.user import UserSignup, UserLogin, UserResponse, Token

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED, summary="Register a new user account")
async def signup(user_in: UserSignup):
    # Validation checks
    if user_in.password != user_in.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password and confirm password do not match."
        )

    email_clean = user_in.email.strip().lower()

    # Check for existing user
    if db.is_connected and db.db is not None:
        existing_user = await db.db.users.find_one({"email": email_clean})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address is already registered."
            )
    else:
        existing_user = next(
            (u for u in in_memory_store.get("users", []) if u.get("email") == email_clean), None
        )
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address is already registered."
            )

    user_id = str(uuid.uuid4())
    password_hash = hash_password(user_in.password)
    now_iso = datetime.now(timezone.utc).isoformat()

    user_doc = {
        "_id": user_id,
        "id": user_id,
        "full_name": user_in.full_name.strip(),
        "email": email_clean,
        "password_hash": password_hash,
        "created_at": now_iso,
        "updated_at": now_iso
    }

    # Save user to DB or in-memory fallback
    if db.is_connected and db.db is not None:
        try:
            await db.db.users.insert_one(user_doc)
        except DuplicateKeyError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address is already registered."
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error registering user: {str(e)}"
            )
    else:
        in_memory_store["users"].append(user_doc)

    # Initialize default profile document for seamless user experience
    profile_doc = {
        "_id": str(uuid.uuid4()),
        "user_id": user_id,
        "full_name": user_in.full_name.strip(),
        "email": email_clean,
        "education_level": "Bachelor's Degree",
        "degree": "B.Tech / B.E.",
        "branch": "Computer Science",
        "graduation_year": 2026,
        "current_skills": ["Python", "JavaScript"],
        "interests": ["Software Engineering", "AI"],
        "preferred_category": "IT",
        "updated_at": now_iso
    }

    if db.is_connected and db.db is not None:
        try:
            await db.db.profiles.insert_one(profile_doc)
        except Exception:
            pass
    else:
        in_memory_store["profiles"][user_id] = profile_doc

    # Generate access token
    access_token = create_access_token(data={"sub": user_id, "email": email_clean})
    
    user_resp = UserResponse(
        id=user_id,
        full_name=user_in.full_name.strip(),
        email=email_clean
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_resp
    )

@router.post("/login", response_model=Token, summary="Authenticate user and return JWT access token")
async def login(credentials: UserLogin):
    email_clean = credentials.email.strip().lower()

    if db.is_connected and db.db is not None:
        user = await db.db.users.find_one({"email": email_clean})
    else:
        user = next((u for u in in_memory_store.get("users", []) if u.get("email") == email_clean), None)

    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user_id = str(user.get("_id", user.get("id")))
    access_token = create_access_token(data={"sub": user_id, "email": email_clean})

    user_resp = UserResponse(
        id=user_id,
        full_name=user.get("full_name", ""),
        email=email_clean
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_resp
    )

@router.get("/me", response_model=UserResponse, summary="Get current authenticated user profile info")
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        full_name=current_user["full_name"],
        email=current_user["email"]
    )
