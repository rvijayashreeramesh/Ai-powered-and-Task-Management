from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Any
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.schemas.user import UserInDB
from app.api.deps import get_current_user
from app.db.mongodb import db_instance

router = APIRouter()

def validate_object_id(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_in: ProjectCreate,
    current_user: UserInDB = Depends(get_current_user)
) -> Any:
    now = datetime.utcnow()
    project_dict = project_in.model_dump()
    project_dict["owner"] = current_user.id
    project_dict["created_date"] = now
    project_dict["updated_date"] = now

    result = await db_instance.db.projects.insert_one(project_dict)
    project_dict["id"] = str(result.inserted_id)
    return project_dict

@router.get("/", response_model=List[ProjectResponse])
async def read_projects(
    current_user: UserInDB = Depends(get_current_user)
) -> Any:
    cursor = db_instance.db.projects.find({"owner": current_user.id})
    projects = await cursor.to_list(length=100)
    for p in projects:
        p["id"] = str(p.pop("_id"))
    return projects

@router.get("/{project_id}", response_model=ProjectResponse)
async def read_project(
    project_id: str,
    current_user: UserInDB = Depends(get_current_user)
) -> Any:
    obj_id = validate_object_id(project_id)
    project = await db_instance.db.projects.find_one({"_id": obj_id, "owner": current_user.id})
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    project["id"] = str(project.pop("_id"))
    return project

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_in: ProjectUpdate,
    current_user: UserInDB = Depends(get_current_user)
) -> Any:
    obj_id = validate_object_id(project_id)
    project = await db_instance.db.projects.find_one({"_id": obj_id, "owner": current_user.id})
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    update_data = project_in.model_dump(exclude_unset=True)
    if update_data:
        update_data["updated_date"] = datetime.utcnow()
        await db_instance.db.projects.update_one(
            {"_id": obj_id},
            {"$set": update_data}
        )
        project.update(update_data)
        
    project["id"] = str(project.pop("_id"))
    return project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    current_user: UserInDB = Depends(get_current_user)
) -> None:
    obj_id = validate_object_id(project_id)
    result = await db_instance.db.projects.delete_one({"_id": obj_id, "owner": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return None
