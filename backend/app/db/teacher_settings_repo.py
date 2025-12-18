# backend/app/db/settings_repo.py
from typing import Optional, Dict, Any
from datetime import datetime
from app.db.mongo import db               # db must be an AsyncIOMotorDatabase instance
from pymongo import ReturnDocument

COL = "teachers"

def _flatten(prefix: str, d: Dict[str, Any], out: Dict[str, Any]) -> None:
    """Convert nested dict to dot notation for $set updates"""
    for k, v in d.items():
        key = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            _flatten(key, v, out)
        else:
            out[key] = v

async def get_by_user(user_id: str) -> Optional[Dict[str, Any]]:
    """Return the raw document or None"""
    return await db[COL].find_one({"userId": user_id})

async def create_default(user_id: str, profile: dict):
    now = datetime.utcnow()

    default = {
        "userId": user_id,
        "profile": {
            "name": profile.get("name", ""),
            "email": profile.get("email", ""),
            "phone": profile.get("phone", ""),
            "role": profile.get("role", ""),
            "subjects": profile.get("subjects", []),
            "avatarUrl": profile.get("avatarUrl", None),
            "employee_id": profile.get("employee_id"),
            "department": profile.get("department"),
        },
        "theme": "Light",
        "notifications": {"push": True, "inApp": True, "sound": False},
        "emailPreferences": [
            {"key": "daily_summary", "enabled": True},
            {"key": "critical_alerts", "enabled": True},
            {"key": "product_updates", "enabled": False},
        ],
        "thresholds": {"warningVal": 75, "safeVal": 85},
        "faceSettings": {"liveness": True, "sensitivity": 80, "enrolledAt": None},
        "createdAt": now,
        "updatedAt": now,
    }

    await db[COL].insert_one(default)
    return default


async def upsert(user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(payload, dict) or not payload:
        # nothing to upsert; return existing document
        return await get_by_user(user_id)

    payload = payload.copy()
    payload["updatedAt"] = datetime.utcnow()

    # NOTE: we pass filter and update as positional args: (filter, update, ...)
    res = await db[COL].find_one_and_update(
        {"userId": user_id},
        {"$set": payload},                 # <-- required second positional arg 'update'
        upsert=True,
        return_document=ReturnDocument.AFTER
    )
    # find_one_and_update should return the document after update due to ReturnDocument.AFTER
    return res

async def patch(user_id: str, patch_payload: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(patch_payload, dict) or not patch_payload:
        return await get_by_user(user_id)

    update_doc: Dict[str, Any] = {}
    set_map: Dict[str, Any] = {}

    profile = patch_payload.get("profile", {})

    # ---- HANDLE ARRAY OPERATORS (subjects) ----
    if isinstance(profile.get("subjects"), dict):
        subjects_op = profile["subjects"]

        if "$addToSet" in subjects_op:
            update_doc["$addToSet"] = {
                "profile.subjects": subjects_op["$addToSet"]
            }

        # remove subjects from normal flattening
        profile = {k: v for k, v in profile.items() if k != "subjects"}

    # ---- HANDLE NORMAL $set FIELDS ----
    remaining_payload = dict(patch_payload)
    if profile:
        remaining_payload["profile"] = profile
    else:
        remaining_payload.pop("profile", None)

    _flatten("", remaining_payload, set_map)

    if set_map:
        set_map["updatedAt"] = datetime.utcnow()
        update_doc["$set"] = set_map

    # ---- ENSURE subjects ARRAY EXISTS ----
    if "$addToSet" in update_doc:
        await db[COL].update_one(
            {"userId": user_id},
            {"$setOnInsert": {"profile.subjects": []}},
            upsert=True,
        )

    if not update_doc:
        return await get_by_user(user_id)

    return await db[COL].find_one_and_update(
        {"userId": user_id},
        update_doc,
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )



async def create_index_once():
    await db[COL].create_index(
    "userId",
    unique=True,
    partialFilterExpression={"userId": {"$exists": True}}
)

