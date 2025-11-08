#!/usr/bin/env python3
"""
Continue generating Arabic C1-C2 sentences
Appends new sentences to existing file
"""

import json
from pathlib import Path

# Paths
VOCAB_FILE = Path("/tmp/hassan-ar-words.json")
OUTPUT_FILE = Path("public/data/sentences/ar/ar-c1c2-sentences.json")

# Load vocabulary
with open(VOCAB_FILE, "r", encoding="utf-8") as f:
    all_words = json.load(f)

# Load existing sentences
with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
    existing_sentences = json.load(f)

# Find which words are already done
covered_words = set([s["word"] for s in existing_sentences])
print(f"Already covered: {len(covered_words)} words ({len(existing_sentences)} sentences)")

# Get remaining words
remaining_words = [w for w in all_words if w["word"] not in covered_words]
print(f"Remaining: {len(remaining_words)} words ({len(remaining_words) * 3} sentences needed)")

# Save list for manual processing
with open("/tmp/remaining-ar-words.json", "w", encoding="utf-8") as f:
    json.dump(remaining_words, f, ensure_ascii=False, indent=2)

print("\nRemaining words saved to /tmp/remaining-ar-words.json")
print("\nNext 10 words to generate:")
for i, word in enumerate(remaining_words[:10], 1):
    print(f"{i}. {word['word']} - {word['translation']}")
