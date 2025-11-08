#!/usr/bin/env python3
"""
Generate German C1 Gastronomy Sentences - Batch Preparation
===========================================================
This script prepares the vocabulary in batches for Claude Code to generate.
"""

import json
import sys

VOCAB_FILE = "public/data/jawad/de-gastro.json"


def load_vocabulary():
    """Load vocabulary from de-gastro.json"""
    with open(VOCAB_FILE, 'r', encoding='utf-8') as f:
        vocab = json.load(f)
    return vocab


def get_batch(vocab_list, batch_num, batch_size=20):
    """Get a specific batch of vocabulary words"""
    start_idx = batch_num * batch_size
    end_idx = min(start_idx + batch_size, len(vocab_list))
    return vocab_list[start_idx:end_idx], start_idx, end_idx


def display_batch_info(batch, start_idx, end_idx, total):
    """Display information about current batch"""
    print(f"\n{'='*60}")
    print(f"BATCH: Words {start_idx + 1} to {end_idx} ({len(batch)} words)")
    print(f"Progress: {end_idx}/{total} ({end_idx*100//total}%)")
    print(f"{'='*60}\n")

    for i, word_obj in enumerate(batch):
        word = word_obj['word']
        translation_ar = word_obj['translations']['ar']
        explanation_de = word_obj['explanation']['de']

        print(f"{start_idx + i + 1}. {word}")
        print(f"   AR: {translation_ar}")
        print(f"   DE: {explanation_de}")
        print()


def main():
    if len(sys.argv) < 2:
        print("Usage: python generate_de_c1_gastro_batch.py <batch_number>")
        print("Batch size: 20 words (9 batches total for 180 words)")
        sys.exit(1)

    batch_num = int(sys.argv[1])
    vocab = load_vocabulary()

    batch, start_idx, end_idx = get_batch(vocab, batch_num, batch_size=20)

    if not batch:
        print(f"✗ Batch {batch_num} is out of range")
        sys.exit(1)

    display_batch_info(batch, start_idx, end_idx, len(vocab))

    # Output batch as JSON for processing
    print(f"\n{'='*60}")
    print("JSON OUTPUT (for programmatic use):")
    print(f"{'='*60}")
    print(json.dumps(batch, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
