from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Any, Optional
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskStatus, TaskPriority
from app.schemas.user import UserInDB
from app.api.deps import get_current_user
from app.db.mongodb import db_instance

router = APIRouter()

def validate_object_id(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

async def verify_project_ownership(project_id: str, user_id: str):
    obj_id = validate_object_id(project_id)
    project = await db_instance.db.projects.find_one({"_id": obj_id, "owner": user_id})
    if not project:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Project not found or unauthorized")

@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_in: TaskCreate,
    current_user: UserInDB = Depends(get_current_user)
) -> Any:
    await verify_project_ownership(task_in.project_id, current_user.id)
    
    now = datetime.utcnow()
    task_dict = task_in.model_dump()
    task_dict["owner_id"] = current_user.id
    task_dict["created_at"] = now
    task_dict["updated_at"] = now

    # Convert Enums to string for mongo
    if "status" in task_dict:
        task_dict["status"] = task_dict["status"].value
    if "priority" in task_dict:
        task_dict["priority"] = task_dict["priority"].value

    result = await db_instance.db.tasks.insert_one(task_dict)
    task_dict["id"] = str(result.inserted_id)
    return task_dict

@router.get("/", response_model=List[TaskResponse])
async def search_and_filter_tasks(
    project_id: Optional[str] = None,
    status_filter: Optional[TaskStatus] = Query(None, alias="status"),
    priority_filter: Optional[TaskPriority] = Query(None, alias="priority"),
    search: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_user)
) -> Any:
    query = {"owner_id": current_user.id}
    
    if project_id:
        query["project_id"] = project_id
    if status_filter:
        query["status"] = status_filter.value
    if priority_filter:
        query["priority"] = priority_filter.value
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
        
    cursor = db_instance.db.tasks.find(query)
    tasks = await cursor.to_list(length=100)
    for t in tasks:
        t["id"] = str(t.pop("_id"))
    return tasks

@router.get("/{task_id}", response_model=TaskResponse)
async def read_task(
    task_id: str,
    current_user: UserInDB = Depends(get_current_user)
) -> Any:
    obj_id = validate_object_id(task_id)
    task = await db_instance.db.tasks.find_one({"_id": obj_id, "owner_id": current_user.id})
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    task["id"] = str(task.pop("_id"))
    return task

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    task_in: TaskUpdate,
    current_user: UserInDB = Depends(get_current_user)
) -> Any:
    obj_id = validate_object_id(task_id)
    task = await db_instance.db.tasks.find_one({"_id": obj_id, "owner_id": current_user.id})
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        
    if task_in.project_id and task_in.project_id != task["project_id"]:
        await verify_project_ownership(task_in.project_id, current_user.id)
    
    update_data = task_in.model_dump(exclude_unset=True)
    if update_data:
        if "status" in update_data and update_data["status"]:
            update_data["status"] = update_data["status"].value
        if "priority" in update_data and update_data["priority"]:
            update_data["priority"] = update_data["priority"].value
            
        update_data["updated_at"] = datetime.utcnow()
        await db_instance.db.tasks.update_one(
            {"_id": obj_id},
            {"$set": update_data}
        )
        task.update(update_data)
        
    task["id"] = str(task.pop("_id"))
    return task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    current_user: UserInDB = Depends(get_current_user)
) -> None:
    obj_id = validate_object_id(task_id)
    result = await db_instance.db.tasks.delete_one({"_id": obj_id, "owner_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return None
