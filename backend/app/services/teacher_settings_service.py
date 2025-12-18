# backend/app/services/settings_service.py
from typing import Dict, Any
from app.db.teacher_settings_repo import get_by_user, create_default, upsert, patch
from fastapi import HTTPException

async def ensure_settings_for_user(user_id: str, profile: Dict[str, Any]) -> Dict[str, Any]:
    doc = await get_by_user(user_id)
    if doc:
        return doc
    return await create_default(user_id, profile)

async def patch_settings(user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    # Add server-side validation where required
    # e.g., ensure thresholds.safeVal > thresholds.warningVal (optional)
    thr = payload.get("thresholds")
    if thr:
        w = thr.get("warningVal")
        s = thr.get("safeVal")
        if (w is not None and s is not None) and w >= s:
            raise HTTPException(status_code=400, detail="warningVal must be less than safeVal")
    # Sensitivity validation enforced in client & schema; still check here
    face = payload.get("faceSettings")
    if face:
        sens = face.get("sensitivity")
        if sens is not None and not (50 <= int(sens) <= 99):
            raise HTTPException(status_code=400, detail="sensitivity must be 50..99")
    updated = await patch(user_id, payload)
    if not updated:
        # fallback to read
        updated = await get_by_user(user_id)
    return updated

async def replace_settings(user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    # Validate payload shape if necessary
    updated = await upsert(user_id, payload)
    if not updated:
        updated = await get_by_user(user_id)
    return updated


async def update_teacher_profile(user_id: str, profile: dict):
    teacher = await db["teachers"].find_one({"userId": user_id})

    if teacher:
        await db["teachers"].update_one(
            {"userId": user_id},
            {"$set": {
                "name": profile.get("name"),
                "phone": profile.get("phone"),
                "subjects": profile.get("subjects", []),
                "department": profile.get("department"),
                "avatarUrl": profile.get("avatarUrl"),
            }}
        )
    else:
        # Create teacher entry
        await db["teachers"].insert_one({
            "userId": user_id,
            "name": profile.get("name"),
            "phone": profile.get("phone"),
            "subjects": profile.get("subjects", []),
            "department": profile.get("department"),
            "avatarUrl": profile.get("avatarUrl"),
            "created_at": datetime.utcnow()
        })

