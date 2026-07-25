from app.services import book_detail_service


def test_from_open_library_work_returns_normalized_work_details(monkeypatch):
    def fake_get_json(url, params=None):
        assert url.endswith("/works/OL42412330W.json")
        return {
            "title": "Pride and Prejudice",
            "authors": [{"author": {"key": "/authors/OL1A"}}],
            "covers": [123],
            "subjects": ["Fiction"],
            "description": {"value": "A classic novel."},
        }

    monkeypatch.setattr(book_detail_service, "_get_json", fake_get_json)
    monkeypatch.setattr(book_detail_service, "_author_name_from_key", lambda key: "Jane Austen")

    result = book_detail_service._from_open_library_work("OL42412330W")

    assert result is not None
    assert result["id"] == "OL42412330W"
    assert result["title"] == "Pride and Prejudice"
    assert result["author"] == "Jane Austen"
    assert result["source"] == "open_library"
    assert result["open_library_key"] == "/works/OL42412330W"
