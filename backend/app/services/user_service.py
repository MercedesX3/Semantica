from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

from app.core.dynamodb import user_profiles_table
from app.core.security import hash_password, verify_password

EMAIL_INDEX_NAME = "email-index"

def current_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()

def normalize_email(email: str) -> str:
    return email.strip().lower()

def get_user_by_email(email: str) -> dict[str, Any] | None:
    normalized_email = normalize_email(email)

    response = user_profiles_table.query(
        IndexName=EMAIL_INDEX_NAME,
        KeyConditionExpression=Key("email").eq(normalized_email),
        Limit=1,
    )

    items = response.get("Items", [])

    if not items:
        return None

    return items[0]

def get_user_by_id(
    user_id: str,
) -> dict[str, Any] | None:
    response = user_profiles_table.get_item(
        Key={
            "user_id": user_id,
        },
        ConsistentRead=True,
    )

    return response.get("Item")

def create_user(
    email: str,
    password: str,
    first_name: str,
    last_name: str,
) -> dict[str, Any]:
    normalized_email = normalize_email(email)

    existing_user = get_user_by_email(normalized_email)

    if existing_user is not None:
        raise ValueError("An account with this email already exists.")

    now = current_timestamp()

    item = {
        "user_id": str(uuid4()),
        "email": normalized_email,
        "first_name": first_name.strip(),
        "last_name": last_name.strip(),
        "password_hash": hash_password(password),
        "last_active_at": now,
        "updated_at": now,
    }

    user_profiles_table.put_item(
        Item=item,
        ConditionExpression="attribute_not_exists(user_id)",
    )

    return item

def authenticate_user(
    email: str,
    password: str,
) -> dict[str, Any] | None:
    user = get_user_by_email(email)

    if user is None:
        return None

    stored_hash = user.get("password_hash")

    if not stored_hash:
        return None

    if not verify_password(password, stored_hash):
        return None

    return user

def safe_user_response(user: dict[str, Any]) -> dict[str, Any]:
    """Remove private attributes before returning a user."""
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "first_name": user["first_name"],
        "last_name": user["last_name"],
        "last_active_at": user["last_active_at"],
        "updated_at": user["updated_at"],
    }