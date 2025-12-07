# backend/main.py
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
from typing import List, Dict
from io import BytesIO
from PIL import Image
import uvicorn
from dotenv import load_dotenv

load_dotenv() 
app = FastAPI(title="Smart Attendance API")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# ---- Models ------
class LoginRequest(BaseModel):
    email: str
    password: str
    
class UserResponse(BaseModel):
    email: str
    role: str
    name: str
    
# ---------- TEMP "DATABASE" ----------
# For now: hardcoded users (later we connect real DB)
FAKE_USERS = {
    os.getenv("TEACHER_EMAIL"): {
        "password": os.getenv("TEACHER_PASSWORD"),
        "role": "Teacher",
        "name": "Demo Teacher"
    },
    os.getenv("STUDENT_EMAIL"): {
        "password": os.getenv("STUDENT_PASSWORD"),
        "role": "Student",
        "name": "Demo Student"
    }
}



# --- in-memory stub DB ---
STUDENTS = [
    {"roll": "2101", "name": "Ravi Kumar", "attendance": 72},
    {"roll": "2045", "name": "Asha Patel", "attendance": 71},
    {"roll": "2122", "name": "Mira Singh", "attendance": 95}
]


@app.post("/auth/login", response_model=UserResponse)
async def login(payload: LoginRequest):
    # stub auth - replace with real auth
    email = payload.email
    password = payload.password
    
    user = FAKE_USERS.get(email)
    
    if not user or user["password"] != password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    return UserResponse(
        email=email,
        role=user["role"],
        name=user["name"]
    )

@app.get("/api/students")
async def get_students():
    return STUDENTS

@app.post("/api/attendance/mark")
async def mark_attendance(payload: Dict):
    """
    Expecting JSON with {"image": "data:image/jpeg;base64,...."}
    We'll decode the image and (optionally) run face recognition / detection.
    """
    image_b64 = payload.get("image", "")
    if not image_b64:
        return {"error":"no image"}
    # strip header if present
    if "," in image_b64:
        header, image_b64 = image_b64.split(",", 1)
    try:
        img_bytes = base64.b64decode(image_b64)
        img = Image.open(BytesIO(img_bytes)).convert("RGB")
        # Save or process image:
        # img.save("last_capture.jpg")
    except Exception as e:
        return {"error": str(e)}

    # PLACEHOLDER: implement face recognition here
    # Example (pseudo):
    # detected_students = run_face_recognition(img)
    # For now return stub:
    detected = [
        {"roll":"2101","name":"Ravi Kumar"},
        {"roll":"2122","name":"Mira Singh"}
    ]
    # You should update attendance records accordingly in a real DB
    return {"ok": True, "detected": detected, "count": len(detected)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
