import base64
import logging
from datetime import date, datetime, timedelta, timezone
from typing import Dict, List

import jwt
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends

from app.core.config import ML_CONFIDENT_THRESHOLD, ML_UNCERTAIN_THRESHOLD, settings
from app.db.mongo import db
from app.services.attendance_daily import save_daily_summary
from app.services.ml_client import ml_client
from app.api.deps import get_current_teacher, get_current_student
from app.schemas.qr import QRTokenRequest, QRTokenResponse, QRMarkRequest

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/attendance", tags=["Attendance"])


@router.post("/mark")
async def mark_attendance(payload: Dict):
    """
    Mark attendance by detecting faces in classroom image

    payload:
    {
      "image": "data:image/jpeg;base64,...",
      "subject_id": "..."
    }
    """

    image_b64 = payload.get("image")
    subject_id = payload.get("subject_id")

    if not image_b64 or not subject_id:
        raise HTTPException(status_code=400, detail="image and subject_id required")

    # Load subject
    subject = await db.subjects.find_one({"_id": ObjectId(subject_id)}, {"students": 1})

    if not subject:
        raise HTTPException(404, "Subject not found")

    student_user_ids = [
        s["student_id"] for s in subject["students"] if s.get("verified", False)
    ]

    # Strip base64 header
    if "," in image_b64:
        _, image_b64 = image_b64.split(",", 1)

    try:
        _ = base64.b64decode(image_b64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image")

    # Call ML service to detect faces
    try:
        ml_response = await ml_client.detect_faces(
            image_base64=image_b64, min_face_area_ratio=0.04, num_jitters=3, model="hog"
        )

        if not ml_response.get("success"):
            raise HTTPException(
                status_code=500,
                detail=f"ML service error: {ml_response.get('error', 'Unknown error')}",
            )

        detected_faces = ml_response.get("faces", [])

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to detect faces: {str(e)}")

    if not detected_faces:
        return {"faces": [], "count": 0}

    # Load students of this subject with embeddings
    students_cursor = db.students.find(
        {
            "userId": {"$in": student_user_ids},
            "verified": True,
            "face_embeddings": {"$exists": True, "$ne": []},
        }
    )

    students = await students_cursor.to_list(length=500)

    # Prepare candidate embeddings for batch matching
    candidate_embeddings = []
    for student in students:
        candidate_embeddings.append(
            {
                "student_id": str(student["userId"]),
                "embeddings": student["face_embeddings"],
            }
        )

    # Call ML service to match faces
    try:
        match_response = await ml_client.batch_match(
            detected_faces=[
                {"embedding": face["embedding"]} for face in detected_faces
            ],
            candidate_embeddings=candidate_embeddings,
            confident_threshold=ML_CONFIDENT_THRESHOLD,
            uncertain_threshold=ML_UNCERTAIN_THRESHOLD,
        )

        if not match_response.get("success"):
            raise HTTPException(
                status_code=500,
                detail=f"ML service error: {match_response.get('error', 'Unknown error')}",  # noqa: E501
            )

        matches = match_response.get("matches", [])

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to match faces: {str(e)}")

    # Build results
    results = []
    logger.info("Faces detected: %d", len(detected_faces))

    for i, (face, match) in enumerate(zip(detected_faces, matches)):
        student_id = match.get("student_id")
        distance = match.get("distance")
        status = match.get("status")  # "present" or "unknown"

        # Find student details
        best_match = None
        if student_id:
            best_match = next(
                (s for s in students if str(s["userId"]) == student_id), None
            )

        # Determine status based on config thresholds
        if distance < ML_CONFIDENT_THRESHOLD:
            status = "present"
        elif distance < ML_UNCERTAIN_THRESHOLD:
            status = "uncertain"
        else:
            status = "unknown"
            best_match = None

        logger.debug(
            "Match: %s distance=%.4f",
            best_match["name"] if best_match else "NONE",
            distance,
        )

        # Get user details
        user = None
        if best_match:
            user = await db.users.find_one(
                {"_id": best_match["userId"]}, {"name": 1, "roll": 1}
            )

        # Build result
        location = face.get("location", {})
        results.append(
            {
                "box": {
                    "top": location.get("top"),
                    "right": location.get("right"),
                    "bottom": location.get("bottom"),
                    "left": location.get("left"),
                },
                "status": status,
                "distance": None if not best_match else round(distance, 4),
                "confidence": None
                if not best_match
                else round(max(0.0, 1.0 - distance), 3),
                "student": None
                if not best_match
                else {
                    "id": str(best_match["userId"]),
                    "roll": user.get("roll") if user else None,
                    "name": best_match["name"],
                },
            }
        )

    return {"faces": results, "count": len(results)}


@router.post("/confirm")
async def confirm_attendance(payload: Dict):
    """
    Confirm attendance for students after manual review

    payload:
    {
      "subject_id": "...",
      "present_students": ["id1", "id2", ...],
      "absent_students": ["id3", "id4", ...]
    }
    """
    subject_id = payload.get("subject_id")
    present_students: List[str] = payload.get("present_students", [])
    absent_students: List[str] = payload.get("absent_students", [])

    if not subject_id:
        raise HTTPException(status_code=400, detail="subject_id required")

    today = date.today().isoformat()
    subject_oid = ObjectId(subject_id)
    present_oids = [ObjectId(sid) for sid in present_students]
    absent_oids = [ObjectId(sid) for sid in absent_students]

    # Mark PRESENT students
    await db.subjects.update_one(
        {"_id": subject_oid},
        {
            "$inc": {"students.$[p].attendance.present": 1},
            "$set": {"students.$[p].attendance.lastMarkedAt": today},
        },
        array_filters=[
            {
                "p.student_id": {"$in": present_oids},
                "p.attendance.lastMarkedAt": {"$ne": today},
            }
        ],
    )

    # Mark ABSENT students
    await db.subjects.update_one(
        {"_id": subject_oid},
        {
            "$inc": {"students.$[a].attendance.absent": 1},
            "$set": {"students.$[a].attendance.lastMarkedAt": today},
        },
        array_filters=[
            {
                "a.student_id": {"$in": absent_oids},
                "a.attendance.lastMarkedAt": {"$ne": today},
            }
        ],
    )

    # --- Write daily attendance summary ---
    subject = await db.subjects.find_one({"_id": subject_oid}, {"professor_ids": 1})
    teacher_id = (
        subject["professor_ids"][0]
        if subject and subject.get("professor_ids")
        else None
    )

    await save_daily_summary(
        class_id=subject_oid,
        subject_id=subject_oid,
        teacher_id=teacher_id,
        record_date=today,
        present=len(present_students),
        absent=len(absent_students),
    )

    return {
        "ok": True,
        "present_updated": len(present_students),
        "absent_updated": len(absent_students),
    }


@router.post("/generate-qr", response_model=QRTokenResponse)
async def generate_qr_token(
    request: QRTokenRequest,
    current_teacher: dict = Depends(get_current_teacher),
):
    """
    Generate a signed QR token for attendance
    """
    # Verify subject belongs to teacher
    # Check both teacher_id (direct) and professor_ids (list)
    match_query = {
        "_id": ObjectId(request.subject_id),
        "$or": [
            {"teacher_id": current_teacher["id"]},
            {"professor_ids": current_teacher["id"]}
        ]
    }
    
    subject = await db.subjects.find_one(match_query)

    if not subject:
        # Fallback check if simple find fails (handling different schema versions)
        subject = await db.subjects.find_one({"_id": ObjectId(request.subject_id)})
        if not subject:
             raise HTTPException(404, "Subject not found")
        
        # Check ownership manually if query didn't match
        # This handles if teacher_id is missing or format differs
        tid = current_teacher["id"]
        authorized = False
        if subject.get("teacher_id") == tid: authorized = True
        if tid in subject.get("professor_ids", []): authorized = True
        
        if not authorized:
            raise HTTPException(403, "Access denied to this subject")

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(seconds=request.valid_duration)

    payload = {
        "type": "attendance_qr",
        "subject_id": request.subject_id,
        "teacher_id": str(current_teacher["id"]),
        "iat": now,
        "exp": expires_at,
    }

    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

    return {
        "token": token,
        "expires_at": expires_at,
        "subject_id": request.subject_id
    }


@router.post("/mark-qr")
async def mark_attendance_qr(
    request: QRMarkRequest,
    current_student: dict = Depends(get_current_student),
):
    """
    Mark attendance via QR code token
    """
    try:
        payload = jwt.decode(request.token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(400, "QR code expired")
    except jwt.InvalidTokenError:
        raise HTTPException(400, "Invalid QR code")

    if payload.get("type") != "attendance_qr":
        raise HTTPException(400, "Invalid token type")

    subject_id = payload.get("subject_id")
    student_id = current_student["student"]["_id"]
    student_user_id = current_student["user"]["_id"]

    # Verify student is enrolled in subject
    # Note: students array usually stores student_id which links to students collection, 
    # but sometimes might filter by verified status.
    subject = await db.subjects.find_one({
        "_id": ObjectId(subject_id),
        "students.student_id": student_id
    })

    if not subject:
        raise HTTPException(403, "Not enrolled in this subject")

    today = date.today().isoformat()
    
    # Update attendance
    result = await db.subjects.update_one(
        {
            "_id": ObjectId(subject_id),
            "students": {
                "$elemMatch": {
                    "student_id": student_id,
                    "attendance.lastMarkedAt": {"$ne": today}
                }
            }
        },
        {
            "$inc": {"students.$.attendance.present": 1},
            "$set": {"students.$.attendance.lastMarkedAt": today}
        }
    )
    
    if result.modified_count == 0:
        # Check if already marked
        student_in_subject = next((s for s in subject["students"] if s["student_id"] == student_id), None)
        if student_in_subject and student_in_subject["attendance"].get("lastMarkedAt") == today:
             raise HTTPException(400, "Attendance already marked for today")
        raise HTTPException(500, "Failed to mark attendance or system error")
        
    return {
        "status": "marked", 
        "subject": subject["name"], 
        "date": today,
        "student": current_student["user"]["name"]
    }
