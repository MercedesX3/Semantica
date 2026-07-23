import re
import nltk

from app.services.chapter_service import split_into_chapters


def chunk_text(text: str, target_words: int = 400, overlap_words: int = 50) -> list[str]:
    paragraphs = [p.strip() for p in re.split(r"\n\n+", text) if p.strip()]

    sentences = []
    for paragraph in paragraphs:
        sentences.extend(nltk.sent_tokenize(paragraph))

    chunks = []
    current: list[str] = []
    current_word_count = 0

    for sentence in sentences:
        word_count = len(sentence.split())

        if current_word_count + word_count <= target_words * 1.2:
            current.append(sentence)
            current_word_count += word_count
        else:
            if current:
                chunks.append(" ".join(current))
                overlap_words_list = " ".join(current).split()[-overlap_words:]
                current = [" ".join(overlap_words_list), sentence]
                current_word_count = len(overlap_words_list) + word_count
            else:
                # Single sentence exceeds limit — flush it alone
                chunks.append(sentence)
                current = []
                current_word_count = 0

    if current:
        chunks.append(" ".join(current))

    return chunks


def chunk_text_by_chapter(
    raw_text: str, target_words: int = 400, overlap_words: int = 50
) -> list[dict]:
    """Chunk a book chapter-by-chapter so no chunk spans a chapter boundary.

    Chapters are detected with the same split_into_chapters() the theme
    pipeline uses, so each chunk's chapter_index aligns 1:1 with
    ChapterTheme.chapter_index. Returns dicts with a global sequential
    chunk_index plus chapter_index/chapter_title tags."""
    chapters = split_into_chapters(raw_text)

    out: list[dict] = []
    global_index = 0
    for chapter in chapters:
        for chunk in chunk_text(chapter["text"], target_words, overlap_words):
            out.append({
                "chunk_index": global_index,
                "chapter_index": chapter["chapter_index"],
                "chapter_title": chapter["title"],
                "text": chunk,
            })
            global_index += 1

    return out
