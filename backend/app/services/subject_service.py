from bson import ObjectId
from app.db.subjects_repo import (get_subject_by_code, create_subject, add_professor_to_subject)
from app.services.teacher_settings_service import patch_settings

async def add_subject_for_teacher(teacher_id: ObjectId, name:str, code:str):
    subject = await get_subject_by_code(code)
    
    if subject:
        if teacher_id not in subject.get("professor_ids", []):
            await add_professor_to_subject(subject["_id"], teacher_id)
    else:
        subject = await create_subject(name, code, teacher_id)
    
    await patch_settings(
        teacher_id,
        {
            "profile":{
                "subjects" : {
                    "$addToSet" : subject["_id"]
                }
            }
        }
    )
    
    return {
        "subject_id": subject["_id"],
        "name": subject["name"],
        "code": subject["code"],
    }
        