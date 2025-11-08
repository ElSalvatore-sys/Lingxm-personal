#!/usr/bin/env python3
"""
Build sentence files from vocabulary with existing examples.
Extracts 2 existing examples per word and adds a placeholder for the 3rd.
"""

import json
import os
from datetime import date


def load_vocabulary(file_paths):
    """Load and merge vocabulary from multiple files."""
    merged = []
    for path in file_paths:
        with open(path, 'r', encoding='utf-8') as f:
            vocab = json.load(f)
            merged.extend(vocab)
    return merged


def create_sentence_entry(sentence, translation, word, sentence_id,
                         difficulty, domain, translation_lang):
    """Create a sentence entry."""
    # Find word position
    words = sentence.split()
    target_index = -1
    for i, w in enumerate(words):
        clean_w = w.strip('.,!?;:"""()[]').lower()
        clean_word = word.strip('.,!?;:"""()[]').lower()
        if clean_word in clean_w or clean_w in clean_word:
            target_index = i
            break

    return {
        "id": sentence_id,
        "sentence": sentence,
        "translation": translation,
        "translation_language": translation_lang,
        "target_word": word,
        "target_index": target_index,
        "difficulty": difficulty,
        "domain": domain
    }


def build_sentence_file(config):
    """Build complete sentence file with placeholders for generation."""

    print(f"\n{'='*70}")
    print(f"Building: {config['name']}")
    print(f"{'='*70}")

    vocab = load_vocabulary(config['source_files'])
    print(f"Words: {len(vocab)}")

    output = {
        "metadata": {
            "language": config['language'],
            "language_name": config['language_name'],
            "level": config['level'],
            "source_profiles": config['source_profiles'],
            "source_files": config['source_files'],
            "total_words": len(vocab),
            "total_sentences": len(vocab) * 3,
            "generated_date": str(date.today()),
            "version": "1.0",
            "generator": "Claude Code",
            "domain": config['domain'],
            "translation_languages": config['translation_langs'],
            "notes": config['notes']
        },
        "sentences": {}
    }

    # Process each word
    for idx, word_data in enumerate(vocab, 1):
        word = word_data['word']
        examples = word_data.get('examples', {})

        sentences = []

        # Extract existing sentences
        sentence_num = 0
        for lang_code in config['translation_langs']:
            if lang_code in examples:
                example = examples[lang_code]
                if isinstance(example, list) and len(example) == 2:
                    sentence_id = f"{config['language']}_{idx:03d}_{sentence_num + 1:03d}"
                    difficulty = "basic" if sentence_num == 0 else "intermediate"

                    entry = create_sentence_entry(
                        sentence=example[0],
                        translation=example[1],
                        word=word,
                        sentence_id=sentence_id,
                        difficulty=difficulty,
                        domain=config['domain'],
                        translation_lang=lang_code
                    )
                    sentences.append(entry)
                    sentence_num += 1

        # Add placeholder for 3rd sentence (to be generated)
        if sentence_num < 3:
            sentence_id = f"{config['language']}_{idx:03d}_003"
            sentences.append({
                "id": sentence_id,
                "sentence": f"[GENERATE: {word}]",
                "translation": f"[GENERATE]",
                "translation_language": config['gen_lang'],
                "target_word": word,
                "target_index": -1,
                "difficulty": "advanced",
                "domain": config['domain'],
                "word_data": word_data  # Include for generation reference
            })

        output['sentences'][word] = sentences

    # Save file
    os.makedirs(os.path.dirname(config['output_file']), exist_ok=True)
    with open(config['output_file'], 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"✅ Created: {config['output_file']}")
    print(f"   {len(vocab)} words, {len(vocab) * 2} extracted, {len(vocab)} to generate")


def main():
    base_dir = "/Users/eldiaploo/Desktop/LingXM-Personal"

    configs = [
        {
            "name": "Arabic C1-C2 (Hassan)",
            "language": "ar",
            "language_name": "Arabic",
            "level": "C1-C2",
            "source_profiles": ["hassan"],
            "source_files": [f"{base_dir}/public/data/hassan/ar.json"],
            "output_file": f"{base_dir}/temp/ar-c1c2-sentences-template.json",
            "translation_langs": ["en", "ar"],
            "gen_lang": "en",
            "domain": "professional, business, advanced discourse",
            "notes": "Generated from Hassan's C1-C2 Arabic vocabulary."
        },
        {
            "name": "French B1-B2 Gastronomy",
            "language": "fr",
            "language_name": "French",
            "level": "B1-B2",
            "source_profiles": ["salman", "jawad"],
            "source_files": [
                f"{base_dir}/public/data/salman/fr.json",
                f"{base_dir}/public/data/jawad/fr.json"
            ],
            "output_file": f"{base_dir}/temp/fr-b1b2-gastro-sentences-template.json",
            "translation_langs": ["ar", "de"],
            "gen_lang": "ar",
            "domain": "French gastronomy, cuisine, cooking",
            "notes": "Generated from Salman and Jawad's French gastronomy vocabulary."
        },
        {
            "name": "Italian A1 (Ameeno)",
            "language": "it",
            "language_name": "Italian",
            "level": "A1",
            "source_profiles": ["ameeno"],
            "source_files": [f"{base_dir}/public/data/ameeno/it.json"],
            "output_file": f"{base_dir}/temp/it-a1-sentences-template.json",
            "translation_langs": ["fa", "en"],
            "gen_lang": "en",
            "domain": "basic Italian, greetings, simple phrases",
            "notes": "Generated from Ameeno's A1 Italian vocabulary."
        }
    ]

    for config in configs:
        build_sentence_file(config)

    print("\n" + "="*70)
    print("✅ Template files created!")
    print("="*70)


if __name__ == "__main__":
    main()
