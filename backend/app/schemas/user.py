from pydantic import BaseModel, Field, EmailStr
from typing import Optional

class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserInDB(UserBase):
    id: str
    hashed_password: str

class UserResponse(UserBase):
    id: str

    class Config:
        from_attributes = True
