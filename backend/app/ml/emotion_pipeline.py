import subprocess
import sys
import spacy
from transformers import pipeline

EMOTION_MODEL = "j-hartmann/emotion-english-distilroberta-base"

emotion_classifier = pipeline(
    "text-classification",
    model=EMOTION_MODEL,
    top_k=None,
    truncation=True,
    max_length=512,
)


def _load_spacy():
    try:
        return spacy.load("en_core_web_sm")
    except OSError:
        subprocess.run(
            [sys.executable, "-m", "spacy", "download", "en_core_web_sm"],
            check=True,
        )
        return spacy.load("en_core_web_sm")


nlp = _load_spacy()
