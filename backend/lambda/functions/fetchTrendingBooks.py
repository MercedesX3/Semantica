import boto3
import json
import os
import urllib.request
import urllib.parse

from datetime import datetime, timezone
from urllib.error import HTTPError, URLError


TIMEOUT_SECONDS = 10

HEADERS = {
    "Accept": "application/json",
    "User-Agent": "Semantica/1.0"
}

DYNAMODB_TABLE_NAME = os.environ.get(
    "DYNAMODB_TABLE_NAME",
    "semantica-trending-books"
)

dynamodb = boto3.resource(
    "dynamodb",
    region_name="us-east-2"
)

table = dynamodb.Table(DYNAMODB_TABLE_NAME)


def get_json(url):
    """
    Makes a GET request and returns parsed JSON.
    Uses Python's standard library so we don't have
    to package the requests library with Lambda.
    """

    request = urllib.request.Request(
        url,
        headers=HEADERS
    )

    with urllib.request.urlopen(
        request,
        timeout=TIMEOUT_SECONDS
    ) as response:

        return json.loads(
            response.read().decode("utf-8")
        )


# ---------------------------------------------------------
# OPEN LIBRARY
# ---------------------------------------------------------

def fetch_open_library_fiction_top_10():
    """
    Fetches 10 popular fiction books from Open Library
    to better match the NYT Hardcover Fiction category.
    """

    params = urllib.parse.urlencode({
        "q": "subject:fiction AND language:eng",
        "limit": 10,
        "page": 1,
        "sort": "readinglog",
        "fields": (
            "key,"
            "title,"
            "author_name,"
            "first_publish_year,"
            "isbn,"
            "cover_i"
        )
    })

    url = (
        "https://openlibrary.org/"
        f"search.json?{params}"
    )

    data = get_json(url)

    works = data.get("docs", [])

    books = []

    for rank, book in enumerate(
        works[:10],
        start=1
    ):

        authors = book.get(
            "author_name",
            []
        )

        if isinstance(authors, list):
            author = ", ".join(authors)
        else:
            author = authors

        isbns = book.get(
            "isbn",
            []
        )

        isbn_13 = next(
            (
                isbn
                for isbn in isbns
                if len(
                    str(isbn).replace("-", "")
                ) == 13
            ),
            None
        )

        isbn_10 = next(
            (
                isbn
                for isbn in isbns
                if len(
                    str(isbn).replace("-", "")
                ) == 10
            ),
            None
        )

        cover_id = book.get(
            "cover_i"
        )

        cover_url = None

        if cover_id:
            cover_url = (
                "https://covers.openlibrary.org/"
                f"b/id/{cover_id}-L.jpg"
            )

        work_key = book.get(
            "key"
        )

        source_id = None
        source_url = None

        if work_key:
            source_id = (
                work_key
                .split("/")[-1]
            )

            source_url = (
                "https://openlibrary.org/"
                f"works/{source_id}"
            )

        books.append({
            "source": "open_library",
            "category": "fiction",
            "source_rank": rank,

            "source_id": source_id,

            "title": book.get(
                "title"
            ),

            "author": author,

            "isbn_13": isbn_13,
            "isbn_10": isbn_10,

            "cover_url": cover_url,

            "source_url": source_url
        })

    return books


# ---------------------------------------------------------
# NEW YORK TIMES
# ---------------------------------------------------------

def fetch_nyt_fiction_top_10():
    """
    Fetches the top 10 books from a NYT Best Seller list.
    """

    api_key = os.environ.get("NYT_API_KEY")

    if not api_key:
        raise ValueError(
            "NYT_API_KEY environment variable is missing"
        )

    list_name = os.environ.get(
        "NYT_LIST_NAME",
        "hardcover-fiction"
    )

    encoded_list = urllib.parse.quote(
        list_name,
        safe=""
    )

    params = urllib.parse.urlencode({
        "api-key": api_key
    })

    url = (
        "https://api.nytimes.com/"
        "svc/books/v3/lists/current/"
        f"{encoded_list}.json?{params}"
    )

    data = get_json(url)

    results = data.get("results", {})
    nyt_books = results.get("books", [])

    books = []

    for book in nyt_books[:10]:

        books.append({
            "source": "nytimes",
            "category": "fiction",

            "source_rank": book.get("rank"),

            "source_id": (
                book.get("primary_isbn13")
                or book.get("primary_isbn10")
            ),

            "title": book.get("title"),
            "author": book.get("author"),

            "isbn_13": book.get(
                "primary_isbn13"
            ),

            "isbn_10": book.get(
                "primary_isbn10"
            ),

            "cover_url": book.get(
                "book_image"
            ),

            "description": book.get(
                "description"
            ),

            "publisher": book.get(
                "publisher"
            ),

            "weeks_on_list": book.get(
                "weeks_on_list"
            ),

            "source_url": book.get(
                "amazon_product_url"
            )
        })

    return books


def store_books(books):
    """
    Stores normalized trending books in DynamoDB.
    """

    fetched_at = datetime.now(
        timezone.utc
    ).isoformat()

    with table.batch_writer(
        overwrite_by_pkeys=[
            "source",
            "source_rank"
        ]
    ) as batch:

        for book in books:

            item = {
                key: value
                for key, value in book.items()
                if value is not None
            }

            item["fetched_at"] = fetched_at

            batch.put_item(
                Item=item
            )

    return len(books)

# ---------------------------------------------------------
# LAMBDA HANDLER
# ---------------------------------------------------------

def lambda_handler(event, context):

    all_books = []
    errors = {}

    # -------------------------
    # Open Library
    # -------------------------

    try:

        open_library_books = (
            fetch_open_library_fiction_top_10()
        )

        all_books.extend(
            open_library_books
        )

    except Exception as error:

        print(
            f"Open Library error: {error}"
        )

        errors["open_library"] = str(error)


    # -------------------------
    # NYT
    # -------------------------

    try:

        nyt_books = fetch_nyt_fiction_top_10()

        all_books.extend(
            nyt_books
        )

    except Exception as error:

        print(
            f"NYT error: {error}"
        )

        errors["nytimes"] = str(error)

    # -------------------------
    # Store in DynamoDB
    # -------------------------
    
    stored_count = 0

    if all_books:
        
        try:

            stored_count = store_books(
                all_books
            )

        except Exception as error:

            print(
                f"DynamoDB error: {error}"
            )

            errors["dynamodb"] = str(error)

    # -------------------------
    # Response
    # -------------------------

    response = {

        "fetched_at": datetime.now(
            timezone.utc
        ).isoformat(),

        "total_books": len(all_books),

        "books": all_books,

        "errors": errors
    }

    status_code = (
        200
        if all_books
        else 502
    )

    return {
        "statusCode": status_code,
        "body": json.dumps(response)
    }