from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from app.core.config import settings
from app.schemas.token import TokenPayload
from app.schemas.user import UserInDB
from app.db.mongodb import db_instance

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserInDB:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenPayload(sub=email)
    except JWTError:
        raise credentials_exception
    
    user_doc = await db_instance.db.users.find_one({"email": token_data.sub})
    if user_doc is None:
        raise credentials_exception
    
    return UserInDB(
        id=str(user_doc["_id"]),
        name=user_doc["name"],
        email=user_doc["email"],
        hashed_password=user_doc["hashed_password"]
    )
