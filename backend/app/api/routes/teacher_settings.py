# backend/app/api/routes/settings.py

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from pathlib import Path
from datetime import datetime
import aiofiles

from app.services.teacher_settings_service import (
    ensure_settings_for_user,
    patch_settings,
    replace_settings,
)
from app.db.teacher_settings_repo import create_index_once
from app.db.subjects_repo import ensure_indexes as ensure_subject_indexes
from app.utils.utils import serialize_bson
from app.api.deps import get_current_teacher
from app.services.subject_service import add_subject_for_teacher
from app.db.subjects_repo import get_subjects_by_ids

router = APIRouter(prefix="/settings", tags=["settings"])

# ensure DB index
@router.on_event("startup")
async def _ensure_indexes():
    await create_index_once()
    await ensure_subject_indexes()

# ---------------- GET SETTINGS ----------------
@router.get("", response_model=dict)
async def get_settings(
    current=Depends(get_current_teacher),
):
    user_id = current["id"]
    user = current["user"]
    teacher = current["teacher"]
    

    profile = {
        "id": user_id,
        "name": teacher.get("profile", {}).get("name", user.get("name", "")),
        "email": user.get("email", ""),
        "phone": teacher.get("profile", {}).get("phone", ""),
        "role": "teacher",
        "employee_id": teacher.get("employee_id"),
        "subjects": teacher.get("profile", {}).get("subjects", []),
        "department": teacher.get("department"),
        "avatarUrl": teacher.get("avatarUrl"),
    }

    doc = await ensure_settings_for_user(user_id, profile)
    
    subject_ids = teacher.get("profile", {}).get("subjects", [])
    populated_subjects = await get_subjects_by_ids(subject_ids)
    print(subject_ids, populated_subjects)
    
    doc["profile"]["subjects"] = populated_subjects
    
    return serialize_bson(doc)

# ---------------- PATCH SETTINGS ----------------
@router.patch("", response_model=dict)
async def patch_settings_route(
    payload: dict,
    current=Depends(get_current_teacher),
):
    if not payload:
        raise HTTPException(status_code=400, detail="Empty payload")

    updated = await patch_settings(current["id"], payload)
    return serialize_bson(updated)

# ---------------- PUT SETTINGS ----------------
@router.put("", response_model=dict)
async def put_settings_route(
    payload: dict,
    current=Depends(get_current_teacher),
):
    updated = await replace_settings(current["id"], payload)
    return serialize_bson(updated)

# ---------------- AVATAR UPLOAD ----------------
UPLOAD_DIR = Path("app/static/avatars")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/upload-avatar", response_model=dict)
async def upload_avatar(
    file: UploadFile = File(...),
    current=Depends(get_current_teacher),
):
    ext = Path(file.filename).suffix.lower()
    if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    fname = f"{current['id']}_{int(datetime.utcnow().timestamp())}{ext}"
    dest = UPLOAD_DIR / fname

    async with aiofiles.open(dest, "wb") as out:
        await out.write(await file.read())

    avatar_url = f"/static/avatars/{fname}"

    updated = await patch_settings(
        current["id"],
        {"profile": {"avatarUrl": avatar_url}},
    )

    return {
        "avatarUrl": avatar_url,
        "settings": serialize_bson(updated),
    }
    
@router.post("/add-subject", response_model=dict)
async def add_subject(
    payload: dict,
    current = Depends(get_current_teacher)
):
    name = payload.get("name")
    code = payload.get("code")
    
    if not name or not code:
        raise HTTPException(status_code=400, detail="Name and Code required")
    
    subject = await add_subject_for_teacher(
        current["id"],
        name.strip(),
        code.strip().upper(),
    )
    
    return serialize_bson(subject)
