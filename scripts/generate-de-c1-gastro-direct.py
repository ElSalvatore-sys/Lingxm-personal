#!/usr/bin/env python3
"""
Direct generation of 540 German C1 gastronomy sentences with Arabic translations.
This version uses pre-generated sentence data.
"""

import json
from datetime import datetime
import os

# This will be populated with the sentence data
SENTENCE_DATA = {}

def create_sentence_entry(word, ar_word, sentence_num, de_full, ar_full, difficulty, context):
    """Create a properly formatted sentence entry"""

    # Extract target word (remove article if present)
    target_word = word.split()[-1] if ' ' in word else word

    # Create blank versions
    de_blank = de_full.replace(word, '_____')
    # For genitive or other cases, try different forms
    if '_____' not in de_blank:
        # Try without article
        de_blank = de_full.replace(target_word, '_____')

    ar_blank = ar_full.replace(ar_word, '_____')

    # Find target index in German
    de_words = de_full.split()
    target_index = 0
    for idx, w in enumerate(de_words):
        if target_word.lower() in w.lower() or word.lower() in w.lower():
            target_index = idx
            break

    # Find target index in Arabic
    ar_words = ar_full.split()
    ar_target_index = 0
    ar_target_word = ar_word.split()[0] if ' ' in ar_word else ar_word
    for idx, w in enumerate(ar_words):
        if ar_target_word in w:
            ar_target_index = idx
            break

    sentence_id = f"de_c1_gastro_{sentence_num:04d}"

    return {
        "id": sentence_id,
        "de": {
            "full": de_full,
            "blank": de_blank,
            "target_word": target_word,
            "target_index": target_index
        },
        "ar": {
            "full": ar_full,
            "blank": ar_blank,
            "target_word": ar_word,
            "target_index": ar_target_index
        },
        "vocabulary_used": [word],
        "difficulty": difficulty,
        "context": context,
        "domain": "gastronomy"
    }

def load_sentence_data():
    """Load the pre-generated sentence data from JSON file"""
    data_file = '/Users/eldiaploo/Desktop/LingXM-Personal/scripts/gastro_sentences_data.json'

    if os.path.exists(data_file):
        with open(data_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    else:
        print(f"Error: Sentence data file not found: {data_file}")
        print("Please ensure the sentence data file exists.")
        return None

def main():
    # Load vocabulary
    with open('/Users/eldiaploo/Desktop/LingXM-Personal/public/data/jawad/de-gastro.json', 'r', encoding='utf-8') as f:
        vocabulary = json.load(f)

    print(f"Loaded {len(vocabulary)} German gastronomy words")

    # Load pre-generated sentence data
    sentence_data = load_sentence_data()

    if not sentence_data:
        print("\nPlease create the sentence data file first.")
        return

    # Process sentences
    all_sentences = {}
    sentence_counter = 1

    print("\nProcessing sentences...")
    print("=" * 60)

    for idx, word_entry in enumerate(vocabulary, 1):
        word = word_entry['word']
        ar_word = word_entry['translations']['ar']

        if word in sentence_data:
            sentences_for_word = []
            word_sentences = sentence_data[word]

            for sent in word_sentences:
                entry = create_sentence_entry(
                    word, ar_word, sentence_counter,
                    sent['de'], sent['ar'],
                    sent['difficulty'], sent['context']
                )
                sentences_for_word.append(entry)
                sentence_counter += 1

            all_sentences[word] = sentences_for_word
            print(f"[{idx}/180] {word}: 3 sentences added")
        else:
            print(f"[{idx}/180] {word}: MISSING DATA")

        if idx % 20 == 0:
            print(f"\nProgress: {idx}/180 words ({sentence_counter-1} sentences)")
            print("=" * 60)

    # Create final output
    output = {
        "metadata": {
            "language": "de",
            "language_name": "German",
            "source_profile": "jawad",
            "source_level": "C1",
            "source_vocabulary": "public/data/jawad/de-gastro.json",
            "total_words": len(all_sentences),
            "total_sentences": (sentence_counter - 1),
            "generated_date": datetime.now().strftime("%Y-%m-%d"),
            "version": "1.0",
            "generator": "Claude Code",
            "model": "claude-sonnet-4-5-20250929",
            "domain": "gastronomy",
            "translations": ["ar", "de"],
            "notes": "Professional German C1-level gastronomy sentences with Arabic translations. Covers haute cuisine, wine pairing, molecular gastronomy, and culinary techniques."
        },
        "sentences": all_sentences
    }

    # Save output
    output_path = '/Users/eldiaploo/Desktop/LingXM-Personal/public/data/sentences/de-specialized/de-c1-gastro-sentences.json'
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 60)
    print(f"✓ Generation complete!")
    print(f"✓ Output saved to: {output_path}")
    print(f"✓ Total words: {len(all_sentences)}")
    print(f"✓ Total sentences: {sentence_counter - 1}")
    print("=" * 60)

if __name__ == '__main__':
    main()
