#!/usr/bin/env python3
"""
Extract existing sentences from vocabulary files to see what we have.
"""

import json


def analyze_vocabulary(file_path: str, name: str):
    """Analyze a vocabulary file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        vocab = json.load(f)

    print(f"\n{name}")
    print("=" * 60)
    print(f"Total words: {len(vocab)}")

    # Count sentences
    total_examples = 0
    languages = set()

    for word_data in vocab[:5]:  # Sample first 5 words
        word = word_data['word']
        examples = word_data.get('examples', {})

        print(f"\nWord: {word}")
        print(f"  Example languages: {list(examples.keys())}")

        for lang, example in examples.items():
            languages.add(lang)
            if isinstance(example, list) and len(example) == 2:
                print(f"  {lang}: {example[0][:50]}... → {example[1][:50]}...")
                total_examples += 1

    print(f"\nLanguages with examples: {languages}")


def main():
    """Main function."""
    base_dir = "/Users/eldiaploo/Desktop/LingXM-Personal"

    files = [
        (f"{base_dir}/public/data/hassan/ar.json", "Hassan - Arabic C1-C2"),
        (f"{base_dir}/public/data/salman/fr.json", "Salman - French B1-B2"),
        (f"{base_dir}/public/data/jawad/fr.json", "Jawad - French B1-B2"),
        (f"{base_dir}/public/data/ameeno/it.json", "Ameeno - Italian A1"),
    ]

    for file_path, name in files:
        analyze_vocabulary(file_path, name)


if __name__ == "__main__":
    main()
