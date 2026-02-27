from app.db.mongo import db
from datetime import datetime, UTC
from bson import ObjectId

attendance_col = db["attendance"]


async def mark_attendance(payload: dict):
    payload["created_at"] = datetime.now(UTC).isoformat()
    res = await attendance_col.insert_one(payload)
    doc = await attendance_col.find_one({"_id": res.inserted_id})
    doc["_id"] = str(doc["_id"])
    return doc


async def log_grouped_attendance(
    subject_id: str | ObjectId,
    date_str: str,
    students: list,
    teacher_id: str | ObjectId | None = None,
):
    """
    Groups attendance logs by subject and date.
    students: List of { studentId: ObjectId, scanTime: str, method: str }
    """
    subject_oid = ObjectId(subject_id)
    tid = ObjectId(teacher_id) if teacher_id else None

    # Update doc
    update_doc = {
        "$addToSet": {"students": {"$each": students}},
        "$setOnInsert": {
            "createdAt": datetime.now(UTC),
        },
    }

    if tid:
        # If teacherId is provided, we set it (or overwrite it if needed)
        # But usually we just set upon insert. Let's make it $set just in case.
        # However, to avoid overriding with None, we check.
        if "$set" not in update_doc:
            update_doc["$set"] = {}
        update_doc["$set"]["teacherId"] = tid

    await db.attendance_logs.update_one(
        {"subjectId": subject_oid, "date": date_str},
        update_doc,
        upsert=True,
    )
    
    # Return the updated document count if possible, or we might need to fetch it
    # But for efficiency, we can just return nothing and let caller decide.
    # However, for analytics, we might want to know the total count.
    # Let's return the new document or fetch it.
    
    return await db.attendance_logs.find_one({"subjectId": subject_oid, "date": date_str})


async def get_attendance_for_student(student_id: str, start_date=None, end_date=None):
    q = {"student_id": ObjectId(student_id)}
    if start_date and end_date:
        q["date"] = {"$gte": start_date, "$lte": end_date}
    cursor = attendance_col.find(q).sort("date", 1)
    out = []
    async for r in cursor:
        r["_id"] = str(r["_id"])
        out.append(r)
    return out
