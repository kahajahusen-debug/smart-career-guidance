from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.seed import router as seed_router
from app.api.v1.careers import router as careers_router
from app.api.v1.questions import router as questions_router
from app.api.v1.jobs import router as jobs_router
from app.api.v1.projects import router as projects_router
from app.api.v1.auth import router as auth_router
from app.api.v1.profile_api import router as profile_router
from app.api.v1.assessment_api import router as assessment_router, skill_assessment_router as skill_assessment_router
from app.api.v1.discovery import router as discovery_router
from app.api.v1.recommendations import router as recommendations_router
from app.api.v1.action_plan import router as action_plan_router
from app.api.v1.applications import router as applications_router

api_v1_router = APIRouter()

api_v1_router.include_router(health_router, tags=["System Health"])
api_v1_router.include_router(seed_router, tags=["Database Seed"])
api_v1_router.include_router(auth_router)
api_v1_router.include_router(profile_router)
api_v1_router.include_router(discovery_router)
api_v1_router.include_router(assessment_router)
api_v1_router.include_router(skill_assessment_router)
api_v1_router.include_router(recommendations_router)
api_v1_router.include_router(action_plan_router)
api_v1_router.include_router(applications_router)
api_v1_router.include_router(careers_router, tags=["Career Catalog"])
api_v1_router.include_router(questions_router, tags=["Assessment Question Bank"])
api_v1_router.include_router(jobs_router, tags=["Job & Internship Recommendations"])
api_v1_router.include_router(projects_router, tags=["Portfolio Projects"])

