from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status: str = Field(default="pending")
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None

class ProjectInDB(ProjectBase):
    id: str
    owner: str
    created_date: datetime
    updated_date: datetime

class ProjectResponse(ProjectInDB):
    class Config:
        from_attributes = True
