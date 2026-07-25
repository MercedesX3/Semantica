from typing import Any

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Response,
    status,
)

from app.api.dependencies import get_current_user
from app.core.config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    AUTH_COOKIE_NAME,
    COOKIE_SECURE,
)
from app.core.security import create_access_token
from app.schemas.user import (
    CreateUserRequest,
    LoginRequest,
    UserResponse,
)
from app.services.user_service import (
    authenticate_user,
    create_user,
    safe_user_response,
)

router = APIRouter(
    prefix="/auth",
    tags=["authentication"],
)


def set_auth_cookie(
    response: Response,
    user_id: str,
) -> None:
    token = create_access_token(user_id)

    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    request: CreateUserRequest,
    response: Response,
):
    try:
        user = create_user(
            email=str(request.email),
            password=request.password,
            first_name=request.first_name,
            last_name=request.last_name,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error

    set_auth_cookie(
        response=response,
        user_id=user["user_id"],
    )

    return safe_user_response(user)


@router.post(
    "/login",
    response_model=UserResponse,
)
def login(
    request: LoginRequest,
    response: Response,
):
    user = authenticate_user(
        email=str(request.email),
        password=request.password,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    set_auth_cookie(
        response=response,
        user_id=user["user_id"],
    )

    return safe_user_response(user)


@router.get(
    "/me",
    response_model=UserResponse,
)
def get_me(
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return safe_user_response(current_user)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
)
def logout(response: Response) -> None:
    response.delete_cookie(
        key=AUTH_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
    )