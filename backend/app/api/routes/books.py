from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_books():
    return {"message": "Books route working"}