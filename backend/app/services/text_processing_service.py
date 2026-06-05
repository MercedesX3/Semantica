import re
import nltk


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
