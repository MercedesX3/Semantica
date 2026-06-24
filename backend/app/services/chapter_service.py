import re

# A real chapter heading is always followed by substantial prose. A Table of
# Contents entry (seen in Frankenstein's Gutenberg edition: "Chapter 1",
# "Chapter 2", ... each followed immediately by the next heading with nothing
# in between) is not. 50 words is a conservative floor — comfortably below
# even a very short real chapter, comfortably above a bare TOC line.
MIN_CHAPTER_WORDS = 50

# Two patterns instead of one, since Roman-numeral chapters ("CHAPTER II.")
# and Arabic-numeral chapters (" Chapter 1") have different numeral character
# classes and trying to cram both into one regex hurts readability more than
# it saves. Both are matched with .match() against a *stripped* line, which
# is what makes "is this line short / mostly just the heading" tractable —
# anchoring on the whole line rather than searching for the keyword anywhere
# in a longer sentence (e.g. "SCENE. During the greater part of the Play..."
# in Romeo and Juliet never matches, since it doesn't start with "chapter").
#
# Deliberate choice: "PART I" (Crime and Punishment) is NOT matched here, so
# Part headings fall through as ordinary body text inside whatever chapter
# they sit next to, rather than becoming their own split point. Revisit if
# you want Part-level grouping later.
CHAPTER_HEADING_PATTERNS: list[re.Pattern] = [
    re.compile(r"^chapter\s+[ivxlcdm]+[.\]]*\s*$", re.IGNORECASE),  # "CHAPTER II.", "Chapter I.]"
    re.compile(r"^chapter\s+\d+[.\]]*\s*$", re.IGNORECASE),         # " Chapter 1"
]


def _match_heading(line: str) -> re.Match | None:
    for pattern in CHAPTER_HEADING_PATTERNS:
        match = pattern.match(line)
        if match:
            return match
    return None


def split_into_chapters(raw_text: str) -> list[dict]:
    """
    Split a book's raw text into chapters.

    Returns a list of {"chapter_index": int, "title": str | None, "text": str},
    in detection order. If no chapter headings are found, falls back to
    treating the entire text as a single chapter (chapter_index 0, title None).
    """
    lines = raw_text.splitlines(keepends=True)

    # (line_start_offset, heading_text) for every line that matches the pattern
    heading_positions: list[tuple[int, str]] = []
    offset = 0
    for line in lines:
        match = _match_heading(line.strip())
        if match:
            heading_positions.append((offset, line.strip()))
        offset += len(line)

    if not heading_positions:
        return [{"chapter_index": 0, "title": None, "text": raw_text}]

    chapters = []
    for i, (start, title) in enumerate(heading_positions):
        end = heading_positions[i + 1][0] if i + 1 < len(heading_positions) else len(raw_text)
        chapters.append({
            "title": title,
            "text": raw_text[start:end].strip(),
        })

    # Drop TOC stub entries (heading immediately followed by the next
    # heading, with no real prose in between), then re-index sequentially
    # since dropping entries leaves gaps in the original detection order.
    real_chapters = [c for c in chapters if len(c["text"].split()) >= MIN_CHAPTER_WORDS]

    return [
        {"chapter_index": i, "title": c["title"], "text": c["text"]}
        for i, c in enumerate(real_chapters)
    ]
