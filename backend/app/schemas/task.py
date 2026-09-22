from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class TaskStatus(str, Enum):
    TODO = "Todo"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"

class TaskPriority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    project_id: str
    assigned_to: Optional[str] = None
    status: TaskStatus = Field(default=TaskStatus.TODO)
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM)
    due_date: Optional[datetime] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    project_id: Optional[str] = None
    assigned_to: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None

class TaskInDB(TaskBase):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime

class TaskResponse(TaskInDB):
    class Config:
        from_attributes = True
