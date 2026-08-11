import json

from functions.fetchTrendingBooks import lambda_handler


response = lambda_handler({}, None)

print("Status:", response["statusCode"])

body = json.loads(response["body"])

print(json.dumps(body, indent=2))