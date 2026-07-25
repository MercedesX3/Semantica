"""Map chapter-level DNA signals to Spotify Search queries.

Spotify's Audio Features / Recommendations endpoints are unavailable for new
apps, so we turn emotion + pacing + theme into keyword/genre search strings
and let Search return tracks that match the mood."""

from collections import Counter

# GoEmotions label -> musical mood keyword
_EMOTION_KEYWORDS: dict[str, str] = {
    "admiration": "uplifting inspirational",
    "amusement": "playful lighthearted",
    "anger": "aggressive intense rock",
    "annoyance": "tense edgy",
    "approval": "warm uplifting",
    "caring": "gentle soft acoustic",
    "confusion": "mysterious ambient",
    "curiosity": "curious exploratory",
    "desire": "sensual dreamy",
    "disappointment": "melancholic sad",
    "disapproval": "dark brooding",
    "disgust": "dark industrial",
    "embarrassment": "awkward quiet",
    "excitement": "energetic upbeat",
    "fear": "tense cinematic thriller",
    "gratitude": "warm hopeful",
    "grief": "sorrowful piano",
    "joy": "joyful upbeat happy",
    "love": "romantic soft",
    "nervousness": "anxious tense",
    "neutral": "calm ambient",
    "optimism": "hopeful bright",
    "pride": "triumphant epic",
    "realization": "reflective ambient",
    "relief": "peaceful calm",
    "remorse": "regretful melancholic",
    "sadness": "melancholic sad piano",
    "surprise": "dramatic cinematic",
}

_SENTIMENT_GENRE: dict[str, str] = {
    "positive": "indie folk",
    "neutral": "ambient",
    "negative": "cinematic",
}

# Pacing 0..1 -> energy descriptor
def _energy_bucket(pacing: float) -> str:
    if pacing >= 0.7:
        return "high energy"
    if pacing >= 0.4:
        return "mid tempo"
    return "slow"

# Literary themes that add flavor to the query
_THEME_KEYWORDS: dict[str, str] = {
    "betrayal": "dark dramatic",
    "loyalty": "warm anthemic",
    "isolation": "lonely ambient",
    "belonging": "warm community",
    "coming of age": "nostalgic indie",
    "redemption": "hopeful epic",
    "revenge": "dark intense",
    "sacrifice": "solemn orchestral",
    "identity": "introspective",
    "found family": "warm heartfelt",
    "love and loss": "bittersweet romantic",
    "ambition": "driving motivational",
    "corruption of power": "dark cinematic",
    "justice": "powerful dramatic",
    "survival": "tense survival",
    "freedom vs. control": "rebellious",
    "grief": "mourning piano",
    "forgiveness": "gentle healing",
    "war and its aftermath": "martial cinematic",
    "fate vs. free will": "epic orchestral",
    "deception": "mysterious noir",
    "courage": "heroic epic",
    "obsession": "dark obsessive",
    "guilt and atonement": "heavy melancholic",
    "transformation": "evolving ambient",
    "legacy": "epic legacy",
}


def dominant_emotion(analyses: list[dict]) -> str:
    if not analyses:
        return "neutral"
    return Counter(a["emotion"] for a in analyses).most_common(1)[0][0]


def average_pacing(analyses: list[dict]) -> float:
    if not analyses:
        return 0.5
    return sum(a.get("pacing", 0.5) for a in analyses) / len(analyses)


def dominant_sentiment(analyses: list[dict]) -> str:
    if not analyses:
        return "neutral"
    return Counter(a.get("sentiment", "neutral") for a in analyses).most_common(1)[0][0]


def map_chapter_mood(
    emotion: str,
    sentiment: str,
    pacing: float,
    top_theme: str | None = None,
) -> dict:
    """Build a Spotify Search query + display labels for one chapter."""
    emotion_kw = _EMOTION_KEYWORDS.get(emotion.lower(), "ambient")
    energy = _energy_bucket(pacing)
    genre_seed = _SENTIMENT_GENRE.get(sentiment, "ambient")
    theme_kw = _THEME_KEYWORDS.get((top_theme or "").lower(), "")

    parts = [emotion_kw, energy, genre_seed]
    if theme_kw:
        parts.append(theme_kw)

    query = " ".join(parts)
    mood_label = f"{emotion} · {energy}"

    return {
        "query": query,
        "genre": genre_seed,
        "mood_label": mood_label,
        "emotion": emotion,
        "sentiment": sentiment,
        "pacing": round(pacing, 4),
        "theme": top_theme,
        "energy": energy,
    }
