# Sentence Practice Data

This directory contains sentence practice JSON files for each language.

## File Format

Each file follows this structure:
- `{language}-sentences.json` (e.g., `en-sentences.json`, `ar-sentences.json`)

## Structure

```json
{
  "metadata": {
    "language": "en",
    "language_name": "English",
    "total_words": 180,
    "total_sentences": 540,
    "generated_date": "2025-11-02",
    "version": "1.0"
  },
  "sentences": {
    "word": [
      {
        "id": "unique_id",
        "full": "Complete sentence.",
        "blank": "Sentence with _____.",
        "target_word": "word",
        "target_index": 3,
        "vocabulary_used": ["word1", "word2"],
        "difficulty": "intermediate",
        "domain": "business"
      }
    ]
  }
}
```

## Generation

Sentences generated via Claude Code parallel terminals.
See Phase 2 documentation for generation strategy.
