from typing import Any

from fastapi import HTTPException, Request, status
from jwt.exceptions import InvalidTokenError

from app.core.config import AUTH_COOKIE_NAME
from app.core.security import decode_access_token
from app.services.user_service import get_user_by_id


def get_current_user(
    request: Request,
) -> dict[str, Any]:
    token = request.cookies.get(AUTH_COOKIE_NAME)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated.",
        )

    try:
        user_id = decode_access_token(token)
    except InvalidTokenError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session.",
        ) from error

    user = get_user_by_id(user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists.",
        )

    return user