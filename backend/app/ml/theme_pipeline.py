from transformers import pipeline

THEME_MODEL = "MoritzLaurer/DeBERTa-v3-large-mnli-fever-anli-ling-wanli"

theme_classifier = pipeline(
    "zero-shot-classification",
    model=THEME_MODEL,
    device="mps",  # ~14x faster than CPU here — this model is large enough, and
                   # zero-shot expands each input into one pass per candidate label,
                   # that GPU acceleration wins despite the opposite being true for
                   # the smaller single-pass GoEmotions model. Don't batch multiple
                   # chapters together though — that's what OOM'd, not single calls.
)
