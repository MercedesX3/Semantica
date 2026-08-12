import boto3
import json
import os

from decimal import Decimal
from boto3.dynamodb.conditions import Key

TABLE_NAME = os.environ.get("DYNAMODB_TABLE_NAME", "semantica-trending-books")

dynamodb = boto3.resource("dynamodb", region_name="us-east-2")

table = dynamodb.Table(TABLE_NAME)

def convert_decimal(value):
    if isinstance(value, Decimal):
        if value % 1 == 0:
            return int(value)

        return float(value)

    raise TypeError


def get_books(source):
    response = table.query(
        KeyConditionExpression=Key("source").eq(source),
        ScanIndexForward=True
    )

    return response.get("Items", [])


def lambda_handler(event, context):

    try:
        open_library_books = get_books(
            "open_library"
        )

        nyt_books = get_books(
            "nytimes"
        )

        response = {
            "total_books": (
                len(open_library_books)
                + len(nyt_books)
            ),
            "open_library": open_library_books,
            "nytimes": nyt_books
        }

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": json.dumps(
                response,
                default=convert_decimal
            )
        }

    except Exception as error:
        print(
            f"Error getting trending books: {error}"
        )

        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": json.dumps({
                "error": "Unable to get trending books"
            })
        }