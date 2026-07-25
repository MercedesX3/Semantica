# This module is responsible for setting up the CONNECTION to DynamoDB using Boto3 and retrieving the user profiles table.

import boto3

from app.core.config import (
    AWS_PROFILE,
    AWS_REGION,
    USER_PROFILES_TABLE,
)

session = boto3.Session(
    profile_name=AWS_PROFILE,
    region_name=AWS_REGION,
)

dynamodb = session.resource("dynamodb")

user_profiles_table = dynamodb.Table(USER_PROFILES_TABLE)