#!/usr/bin/env python3
"""
Generate Arabic C1-C2 sentences - Direct approach
This script creates a template that Claude Code will fill in
"""

import json
from pathlib import Path

# Paths
VOCAB_FILE = Path("public/data/hassan/ar.json")
OUTPUT_FILE = Path("public/data/sentences/ar/ar-c1c2-sentences.json")

# Load vocabulary
print("Loading vocabulary...")
with open(VOCAB_FILE, "r", encoding="utf-8") as f:
    vocab = json.load(f)

print(f"Total words: {len(vocab)}")
print(f"Target sentences: {len(vocab) * 3}")

# Create word list for batch processing
words_data = []
for word in vocab:
    words_data.append({
        "word": word["word"],
        "translation": word["translations"]["en"],
        "explanation": word["explanation"]["ar"] if "explanation" in word else ""
    })

# Save word list for processing
with open("/tmp/hassan-ar-words.json", "w", encoding="utf-8") as f:
    json.dump(words_data, f, ensure_ascii=False, indent=2)

print(f"\nWord list saved to /tmp/hassan-ar-words.json")
print(f"Ready for batch processing")
