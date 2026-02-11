import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone

# Setup hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

async def seed():
    # Connect
    uri = "mongodb://localhost:27017"
    client = AsyncIOMotorClient(uri)
    db = client["smart_attendance"]
    
    print("Seeding database...")

    # --- Seed Student ---
    student_email = "student@gmail.com"
    student_pass = "student123"
    
    existing_student = await db.users.find_one({"email": student_email})
    if not existing_student:
        print(f"Creating student: {student_email}")
        user_doc = {
            "name": "Demo Student",
            "email": student_email,
            "password_hash": hash_password(student_pass),
            "role": "student",
            "college_name": "Demo University",
            "is_verified": True,
            "verification_token": None,
            "created_at": datetime.now(timezone.utc)
        }
        res = await db.users.insert_one(user_doc)
        
        student_profile = {
            "userId": res.inserted_id,
            "name": "Demo Student",
            "email": student_email,
            "college_name": "Demo University",
            "branch": "Computer Science",
            "roll": "CS101",
            "year": "3rd Year",
            "created_at": datetime.now(timezone.utc)
        }
        await db.students.insert_one(student_profile)
    else:
        print(f"Student {student_email} already exists.")

    # --- Seed Teacher ---
    teacher_email = "teacher@gmail.com"
    teacher_pass = "teacher123"
    
    existing_teacher = await db.users.find_one({"email": teacher_email})
    if not existing_teacher:
        print(f"Creating teacher: {teacher_email}")
        user_doc = {
            "name": "Demo Teacher",
            "email": teacher_email,
            "password_hash": hash_password(teacher_pass),
            "role": "teacher",
            "college_name": "Demo University",
            "is_verified": True,
            "verification_token": None,
            "created_at": datetime.now(timezone.utc)
        }
        res = await db.users.insert_one(user_doc)
        
        teacher_profile = {
            "userId": res.inserted_id,
            "name": "Demo Teacher",
            "email": teacher_email,
            "college_name": "Demo University",
            "employee_id": "EMP001",
            "phone": "1234567890",
            "created_at": datetime.now(timezone.utc)
        }
        await db.teachers.insert_one(teacher_profile)
    else:
        print(f"Teacher {teacher_email} already exists.")

    print("Seeding complete!")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed())
