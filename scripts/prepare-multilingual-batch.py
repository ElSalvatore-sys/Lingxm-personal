#!/usr/bin/env python3
"""
Prepare vocabulary batches for Claude Code sentence generation.
Creates batches of 30 words for efficient processing.
"""

import json
import os


def load_vocabulary(file_paths):
    """Load and merge vocabulary from multiple files."""
    merged = []
    for path in file_paths:
        with open(path, 'r', encoding='utf-8') as f:
            vocab = json.load(f)
            merged.extend(vocab)
    return merged


def create_batches(vocab, batch_size=30):
    """Split vocabulary into batches."""
    batches = []
    for i in range(0, len(vocab), batch_size):
        batches.append(vocab[i:i + batch_size])
    return batches


def save_batch_file(batch, batch_num, output_dir, prefix):
    """Save batch to file for processing."""
    os.makedirs(output_dir, exist_ok=True)
    filename = f"{output_dir}/{prefix}_batch_{batch_num:02d}.json"
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(batch, f, ensure_ascii=False, indent=2)
    return filename


def main():
    base_dir = "/Users/eldiaploo/Desktop/LingXM-Personal"

    configs = [
        {
            "name": "Arabic C1-C2",
            "files": [f"{base_dir}/public/data/hassan/ar.json"],
            "output_dir": f"{base_dir}/temp/batches/ar",
            "prefix": "ar-c1c2"
        },
        {
            "name": "French B1-B2",
            "files": [
                f"{base_dir}/public/data/salman/fr.json",
                f"{base_dir}/public/data/jawad/fr.json"
            ],
            "output_dir": f"{base_dir}/temp/batches/fr",
            "prefix": "fr-b1b2"
        },
        {
            "name": "Italian A1",
            "files": [f"{base_dir}/public/data/ameeno/it.json"],
            "output_dir": f"{base_dir}/temp/batches/it",
            "prefix": "it-a1"
        }
    ]

    for config in configs:
        print(f"\n{config['name']}")
        print("=" * 60)

        vocab = load_vocabulary(config['files'])
        print(f"Total words: {len(vocab)}")

        batches = create_batches(vocab, batch_size=30)
        print(f"Batches: {len(batches)}")

        for i, batch in enumerate(batches, 1):
            filename = save_batch_file(batch, i, config['output_dir'], config['prefix'])
            print(f"  Batch {i}: {len(batch)} words → {filename}")

    print("\n✅ Batches created successfully!")


if __name__ == "__main__":
    main()
