# api/routes/settings.py
from typing import Dict, Any

from fastapi import APIRouter, Depends, HTTPException

from ...datamodel import Settings
from ..deps import get_db

router = APIRouter()


@router.get("/")
async def get_settings(user_id: str, db: Any = Depends(get_db)) -> Dict[str, Any]:
    try:
        response = db.get(Settings, filters={"user_id": user_id})
        if not response.status or not response.data:
            # create a default settings - let the model use its default factory
            default_settings = Settings(user_id=user_id)
            db.upsert(default_settings)
            response = db.get(Settings, filters={"user_id": user_id})
        settings_data = response.data[0]
        # Ensure config is a dict for serialization
        if "config" in settings_data and not isinstance(settings_data["config"], dict):
            config_obj = settings_data["config"]
            if hasattr(config_obj, "model_dump"):
                settings_data["config"] = config_obj.model_dump()
            elif hasattr(config_obj, "dict"):
                settings_data["config"] = config_obj.dict()
        return {"status": True, "data": settings_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.put("/")
async def update_settings(settings: Settings, db: Any = Depends(get_db)) -> Dict[str, Any]:
    # Ensure config is a dict before saving
    if not isinstance(settings.config, dict):
        # Use model_dump for Pydantic v2, fallback to dict for v1
        if hasattr(settings.config, "model_dump"):
            settings.config = settings.config.model_dump()
        elif hasattr(settings.config, "dict"):
            settings.config = settings.config.dict()
    response = db.upsert(settings)
    if not response.status:
        raise HTTPException(status_code=400, detail=response.message)
    return {"status": True, "data": response.data}
