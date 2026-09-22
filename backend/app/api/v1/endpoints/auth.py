from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from typing import Any
from app.schemas.user import UserCreate, UserResponse
from app.schemas.token import Token
from app.core.security import get_password_hash, verify_password, create_access_token
from app.api.deps import get_current_user
from app.schemas.user import UserInDB
from app.db.mongodb import db_instance

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate) -> Any:
    # Check if user exists
    user_doc = await db_instance.db.users.find_one({"email": user_in.email})
    if user_doc:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    hashed_password = get_password_hash(user_in.password)
    new_user = {
        "name": user_in.name,
        "email": user_in.email,
        "hashed_password": hashed_password
    }
    result = await db_instance.db.users.insert_one(new_user)
    
    return UserResponse(
        id=str(result.inserted_id),
        name=user_in.name,
        email=user_in.email
    )

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()) -> Any:
    user_doc = await db_instance.db.users.find_one({"email": form_data.username})
    if not user_doc or not verify_password(form_data.password, user_doc["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(subject=user_doc["email"])
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/logout")
async def logout() -> Any:
    # Since we are using stateless JWT, logout is typically handled client-side
    # by deleting the token. We'll return a success message.
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
async def read_current_user(current_user: UserInDB = Depends(get_current_user)) -> Any:
    """Test endpoint for protected routes"""
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email
    )
