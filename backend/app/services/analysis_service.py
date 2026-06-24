import re
import nltk
from collections import Counter

from app.ml.emotion_pipeline import emotion_classifier, nlp

# GoEmotions' 27 emotions + neutral, bucketed into 3-way sentiment.
# "Ambiguous" emotions from the GoEmotions paper (confusion, curiosity,
# realization, surprise) are folded into neutral since they don't reliably
# skew positive or negative on their own.
SENTIMENT_MAP = {
    "admiration":    "positive",
    "amusement":     "positive",
    "anger":         "negative",
    "annoyance":     "negative",
    "approval":      "positive",
    "caring":        "positive",
    "confusion":     "neutral",
    "curiosity":     "neutral",
    "desire":        "positive",
    "disappointment": "negative",
    "disapproval":   "negative",
    "disgust":       "negative",
    "embarrassment": "negative",
    "excitement":    "positive",
    "fear":          "negative",
    "gratitude":     "positive",
    "grief":         "negative",
    "joy":           "positive",
    "love":          "positive",
    "nervousness":   "negative",
    "neutral":       "neutral",
    "optimism":      "positive",
    "pride":         "positive",
    "realization":   "neutral",
    "relief":        "positive",
    "remorse":       "negative",
    "sadness":       "negative",
    "surprise":      "neutral",
}

# Emotion-arc labels keyed by (beginning, middle, end) *sentiment* — raw
# emotion triples don't scale once there are 28 possible labels per segment.
SENTIMENT_THEME_MAP = {
    ("positive", "positive", "positive"): "Triumphant Journey",
    ("positive", "negative", "positive"): "Redemption Arc",
    ("positive", "neutral", "positive"):  "Steady Optimism",
    ("positive", "negative", "negative"): "Decline",
    ("negative", "negative", "negative"): "Tragedy",
    ("negative", "negative", "positive"): "From Despair to Hope",
    ("negative", "positive", "positive"): "Transformation",
    ("negative", "positive", "negative"): "Bittersweet",
    ("neutral", "neutral", "neutral"):    "Meditative",
    ("neutral", "negative", "neutral"):   "Introspective",
    ("negative", "neutral", "negative"):  "Sustained Tension",
    ("negative", "negative", "neutral"):  "Exhaustion and Acceptance",
}

# Words too generic to ever count as a "theme" even when they're frequent.
THEME_STOPWORDS = {
    "thing", "things", "way", "ways", "time", "times", "one", "lot",
    "bit", "part", "something", "everything", "nothing", "someone",
    "everyone", "anyone", "people", "day", "days",
}


def _extract_chunk_themes(doc, top_n: int = 3) -> list[str]:
    """Surface topic keywords for a chunk from its most frequent meaningful noun chunks."""
    counts = Counter()
    for chunk in doc.noun_chunks:
        head = chunk.root
        if head.pos_ != "NOUN" or head.is_stop or head.is_punct:
            continue
        lemma = head.lemma_.lower().strip()
        if len(lemma) < 3 or lemma in THEME_STOPWORDS:
            continue
        counts[lemma] += 1

    return [lemma for lemma, _ in counts.most_common(top_n)]


def analyze_chunks(texts: list[str], batch_size: int = 32) -> list[dict]:
    """Analyze many chunks at once. Batching the model calls (instead of one
    chunk at a time) is the difference between seconds and minutes on a
    300+ chunk book — unbatched calls pay full model-dispatch overhead per chunk."""
    if not texts:
        return []

    raw_results = emotion_classifier(texts, batch_size=batch_size)
    docs = list(nlp.pipe(texts, batch_size=batch_size))

    results = []
    for text, raw, doc in zip(texts, raw_results, docs):
        emotion_scores = {item["label"].lower(): round(item["score"], 4) for item in raw}
        dominant_emotion = max(emotion_scores, key=emotion_scores.get)
        intensity = round(emotion_scores[dominant_emotion], 4)
        sentiment = SENTIMENT_MAP.get(dominant_emotion, "neutral")

        # Dialogue density
        matches = re.findall(r'"[^"]*"', text)
        quoted_chars = sum(len(m) for m in matches)
        dialogue_density = round(min(quoted_chars / len(text), 1.0), 4) if text else 0.0

        # Pacing
        sentences = nltk.sent_tokenize(text)
        if sentences:
            words = text.split()
            avg_len = len(words) / len(sentences)
            clamped = max(5.0, min(40.0, avg_len))
            prose_score = 1.0 - (clamped - 5.0) / 35.0
        else:
            prose_score = 0.5
        pacing = round(0.7 * prose_score + 0.3 * dialogue_density, 4)

        # Characters via spaCy NER, themes via noun-chunk frequency (same parse, reused)
        characters = list(dict.fromkeys(
            ent.text.strip()
            for ent in doc.ents
            if ent.label_ == "PERSON" and len(ent.text.strip()) > 1
        ))
        themes = _extract_chunk_themes(doc)

        results.append({
            "emotion": dominant_emotion,
            "emotion_scores": emotion_scores,
            "sentiment": sentiment,
            "intensity": intensity,
            "pacing": pacing,
            "dialogue_density": dialogue_density,
            "characters": characters,
            "themes": themes,
        })

    return results


def analyze_chunk(text: str) -> dict:
    return analyze_chunks([text])[0]


def extract_themes(analyses: list[dict]) -> dict:
    n = len(analyses)
    if n < 3:
        emotions = [a["emotion"] for a in analyses]
        dominant = Counter(emotions).most_common(1)[0][0] if emotions else "neutral"
        return {
            "beginning_emotion": dominant,
            "middle_emotion": dominant,
            "end_emotion": dominant,
            "theme_arc": "Insufficient data",
        }

    third = n // 3
    segments = {
        "beginning": analyses[:third],
        "middle": analyses[third: 2 * third],
        "end": analyses[2 * third:],
    }

    def dominant_emotion(segment: list[dict]) -> str:
        emotions = [a["emotion"] for a in segment]
        return Counter(emotions).most_common(1)[0][0]

    beginning = dominant_emotion(segments["beginning"])
    middle = dominant_emotion(segments["middle"])
    end = dominant_emotion(segments["end"])

    sentiment_arc = tuple(SENTIMENT_MAP.get(e, "neutral") for e in (beginning, middle, end))
    theme = SENTIMENT_THEME_MAP.get(sentiment_arc, "Complex Narrative")

    return {
        "beginning_emotion": beginning,
        "middle_emotion": middle,
        "end_emotion": end,
        "theme_arc": theme,
    }


def aggregate_themes(analyses: list[dict], top_n: int = 8) -> list[str]:
    """Roll up the most common per-chunk topic themes across an entire book."""
    counts = Counter(theme for a in analyses for theme in a.get("themes", []))
    return [theme for theme, _ in counts.most_common(top_n)]
