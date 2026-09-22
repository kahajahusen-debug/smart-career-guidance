from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.seed import router as seed_router
from app.api.v1.careers import router as careers_router
from app.api.v1.questions import router as questions_router
from app.api.v1.jobs import router as jobs_router
from app.api.v1.projects import router as projects_router

api_v1_router = APIRouter()

api_v1_router.include_router(health_router, tags=["System Health"])
api_v1_router.include_router(seed_router, tags=["Database Seed"])
api_v1_router.include_router(careers_router, tags=["Career Catalog"])
api_v1_router.include_router(questions_router, tags=["Assessment Question Bank"])
api_v1_router.include_router(jobs_router, tags=["Sample Job Listings"])
api_v1_router.include_router(projects_router, tags=["Portfolio Projects"])
