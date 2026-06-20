import re
import nltk
from collections import Counter

from app.ml.emotion_pipeline import emotion_classifier, nlp

SENTIMENT_MAP = {
    "joy":      "positive",
    "surprise": "positive",
    "neutral":  "neutral",
    "fear":     "negative",
    "anger":    "negative",
    "sadness":  "negative",
    "disgust":  "negative",
}

THEME_MAP = {
    ("joy", "joy", "joy"):             "Triumphant Journey",
    ("joy", "sadness", "joy"):         "Redemption Arc",
    ("joy", "fear", "joy"):            "Hero's Trial",
    ("joy", "anger", "joy"):           "Conflict and Resolution",
    ("joy", "anger", "sadness"):       "Decline",
    ("sadness", "sadness", "sadness"): "Tragedy",
    ("sadness", "sadness", "joy"):     "From Despair to Hope",
    ("sadness", "anger", "joy"):       "Transformation",
    ("sadness", "joy", "sadness"):     "Bittersweet",
    ("neutral", "neutral", "neutral"): "Meditative",
    ("neutral", "sadness", "neutral"): "Introspective",
    ("fear", "fear", "fear"):          "Sustained Tension",
    ("fear", "anger", "joy"):          "Survival and Triumph",
    ("anger", "anger", "anger"):       "Relentless Conflict",
    ("anger", "sadness", "neutral"):   "Exhaustion and Acceptance",
}


def analyze_chunk(text: str) -> dict:
    # Emotion
    raw = emotion_classifier(text)[0]
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

    # Characters via spaCy NER
    doc = nlp(text)
    characters = list(dict.fromkeys(
        ent.text.strip()
        for ent in doc.ents
        if ent.label_ == "PERSON" and len(ent.text.strip()) > 1
    ))

    return {
        "emotion": dominant_emotion,
        "emotion_scores": emotion_scores,
        "sentiment": sentiment,
        "intensity": intensity,
        "pacing": pacing,
        "dialogue_density": dialogue_density,
        "characters": characters,
    }


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

    theme = THEME_MAP.get((beginning, middle, end), "Complex Narrative")

    return {
        "beginning_emotion": beginning,
        "middle_emotion": middle,
        "end_emotion": end,
        "theme_arc": theme,
    }
