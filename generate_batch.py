#!/usr/bin/env python3
"""
Generate C1 German sentences in batches using Claude's assistance.
This script processes words in batches and combines results.
"""

import json
from pathlib import Path

def load_words():
    """Load word lists."""
    with open('/tmp/vahiko_words.json', 'r', encoding='utf-8') as f:
        vahiko = json.load(f)
    with open('/tmp/jawad_words.json', 'r', encoding='utf-8') as f:
        jawad = json.load(f)

    # Remove duplicates
    vahiko_unique = list(dict.fromkeys(vahiko))
    jawad_unique = list(dict.fromkeys(jawad))

    return vahiko_unique, jawad_unique

def create_batches(words, batch_size=30):
    """Split words into batches."""
    return [words[i:i + batch_size] for i in range(0, len(words), batch_size)]

def save_batch_list(vahiko_words, jawad_words):
    """Save batch information."""
    vahiko_batches = create_batches(vahiko_words, 30)
    jawad_batches = create_batches(jawad_words, 30)

    batch_info = {
        "vahiko": {
            "total_words": len(vahiko_words),
            "num_batches": len(vahiko_batches),
            "batches": vahiko_batches
        },
        "jawad": {
            "total_words": len(jawad_words),
            "num_batches": len(jawad_batches),
            "batches": jawad_batches
        }
    }

    with open('/tmp/batch_plan.json', 'w', encoding='utf-8') as f:
        json.dump(batch_info, f, ensure_ascii=False, indent=2)

    print(f"Vahiko: {len(vahiko_words)} words in {len(vahiko_batches)} batches")
    print(f"Jawad: {len(jawad_words)} words in {len(jawad_batches)} batches")
    print(f"Total: {len(vahiko_words) + len(jawad_words)} words")
    print(f"Total batches: {len(vahiko_batches) + len(jawad_batches)}")

    return batch_info

if __name__ == "__main__":
    vahiko, jawad = load_words()
    batch_info = save_batch_list(vahiko, jawad)
