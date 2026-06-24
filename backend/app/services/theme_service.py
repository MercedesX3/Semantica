from collections import Counter

from app.ml.theme_pipeline import theme_classifier

THEME_TAXONOMY = [
    "betrayal", "loyalty", "isolation", "belonging", "coming of age",
    "redemption", "revenge", "sacrifice", "identity", "found family",
    "love and loss", "ambition", "corruption of power", "justice",
    "survival", "freedom vs. control", "grief", "forgiveness",
    "class and inequality", "war and its aftermath", "nature vs. civilization",
    "fate vs. free will", "deception", "courage", "obsession",
    "guilt and atonement", "transformation", "legacy",
]


def classify_chapter_themes(
    text: str,
    taxonomy: list[str] = THEME_TAXONOMY,
    top_n: int = 5,
) -> list[dict]:
    """Zero-shot classify a single chapter against the theme taxonomy.

    Labels are scored independently (multi_label=True) since a chapter can
    carry several themes at once. NOTE: the raw confidence scores from this
    model run high across nearly every abstract label (multi_label scoring
    is P(entailment) / (P(entailment) + P(contradiction)), and abstract
    literary themes are rarely directly *contradicted* by a chapter even
    when they're not really present) — verified empirically against Pride
    and Prejudice chapter 1, where ~20/27 themes scored above 0.5 despite
    most being clearly irrelevant. So we rank rather than threshold: the
    *relative* ordering is meaningful even though the absolute numbers
    aren't well-calibrated as probabilities.
    """
    result = theme_classifier(text, candidate_labels=taxonomy, multi_label=True, truncation=True)

    ranked = sorted(zip(result["labels"], result["scores"]), key=lambda pair: -pair[1])

    return [
        {"theme": label, "confidence": round(score, 4)}
        for label, score in ranked[:top_n]
    ]


def aggregate_book_themes(chapter_themes: list[list[dict]], top_n: int = 8) -> list[dict]:
    """Roll up per-chapter theme picks into a book-level profile.

    Score = presence ratio (fraction of chapters where the theme cleared
    top-N) x mean confidence among the chapters where it appeared — captures
    pervasiveness and strength together, rather than letting one intense
    chapter or one weak-but-frequent mention dominate on its own.
    """
    chapter_count = len(chapter_themes)
    if chapter_count == 0:
        return []

    presence = Counter()
    confidence_sum: dict[str, float] = {}

    for chapter in chapter_themes:
        for entry in chapter:
            theme = entry["theme"]
            presence[theme] += 1
            confidence_sum[theme] = confidence_sum.get(theme, 0.0) + entry["confidence"]

    scored = []
    for theme, count in presence.items():
        presence_ratio = count / chapter_count
        mean_confidence = confidence_sum[theme] / count
        scored.append({
            "theme": theme,
            "confidence": round(presence_ratio * mean_confidence, 4),
            "presence_ratio": round(presence_ratio, 4),
            "mean_confidence": round(mean_confidence, 4),
        })

    scored.sort(key=lambda x: -x["confidence"])
    return scored[:top_n]
