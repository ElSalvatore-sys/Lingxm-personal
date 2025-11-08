#!/usr/bin/env python3
"""
Generate English B1-B2 Sentences - Direct Generation
Target: 1,080 sentences (6 per word × 180 words)
"""

import json
import sys

# Load Hassan vocabulary
with open('public/data/hassan/en.json', 'r', encoding='utf-8') as f:
    vocab_data = json.load(f)

print(f"📚 Loaded {len(vocab_data)} vocabulary entries")
print(f"🎯 Ready to generate {len(vocab_data) * 6} sentences")
print("\n" + "="*60)

# Output each word with its details for batch processing
for idx, entry in enumerate(vocab_data, 1):
    word = entry['word']
    translation = entry['translations']['en']
    explanation = entry['explanation']['en']

    print(f"\n[{idx}/{len(vocab_data)}] WORD: {word}")
    print(f"Translation: {translation}")
    print(f"Explanation: {explanation}")
    print("-" * 60)

print("\n✅ Vocabulary loaded and ready for sentence generation")
print(f"Total words: {len(vocab_data)}")
print(f"Target sentences: {len(vocab_data) * 6}")
