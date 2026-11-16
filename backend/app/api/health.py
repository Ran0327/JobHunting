import logging

from fastapi import APIRouter, Response, status

from app.core.config import get_settings
from app.db.health import check_database, check_redis

router = APIRouter(tags=["system"])
settings = get_settings()
logger = logging.getLogger(__name__)


@router.get("/healthz")
async def healthz() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}


@router.get("/readyz")
async def readyz(response: Response) -> dict[str, object]:
    checks: dict[str, str] = {}
    ready = True

    try:
        await check_database()
        checks["database"] = "ok"
    except Exception:
        logger.exception("database readiness check failed")
        checks["database"] = "error"
        ready = False

    try:
        await check_redis()
        checks["redis"] = "ok"
    except Exception:
        logger.exception("redis readiness check failed")
        checks["redis"] = "error"
        ready = False

    if not ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {"status": "ok" if ready else "degraded", "checks": checks}
