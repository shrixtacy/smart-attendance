import os
import jwt
from datetime import datetime, timedelta
from typing import Optional

# Load secret & settings from env (set these in your .env)
JWT_SECRET = os.getenv("JWT_SECRET", "replace-with-strong-secret")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRES_MINUTES = int(os.getenv("JWT_EXPIRES_MINUTES", "60"))

def create_jwt(user_id: str, role: str, expires_minutes: Optional[int] = None) -> str:
    """
    Create a JWT containing minimal claims:
      - sub: user id (string)
      - role: user role (student|teacher)
      - iat, exp
    """
    if expires_minutes is None:
        expires_minutes = JWT_EXPIRES_MINUTES

    now = datetime.utcnow()
    payload = {
        "sub": str(user_id),
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=expires_minutes)).timestamp()),
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    # PyJWT >= 2 returns str; older returns bytes
    if isinstance(token, bytes):
        token = token.decode("utf-8")
    return token

def decode_jwt(token: str) -> dict:
    """
    Decode and validate JWT. Raises jwt exceptions on failure.
    """
    payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    return payload
