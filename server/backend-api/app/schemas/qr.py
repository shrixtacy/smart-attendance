from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class QRTokenRequest(BaseModel):
    subject_id: str = Field(..., description="The subject ID for which attendance is being marked")
    valid_duration: int = Field(30, description="Validity duration in seconds")

class QRTokenResponse(BaseModel):
    token: str
    expires_at: datetime
    subject_id: str

class QRMarkRequest(BaseModel):
    token: str = Field(..., description="The JWT token scanned from the QR code")
    lat: Optional[float] = Field(None, description="Latitude of the student")
    long: Optional[float] = Field(None, description="Longitude of the student")
