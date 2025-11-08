#!/usr/bin/env python3
"""
Generate complete multilingual sentence files.
This script is executed by Claude Code which provides sentence generation.
"""

import json
from datetime import date
import os


def find_word_in_sentence(sentence, word):
    """Find the target word's position in the sentence."""
    words = sentence.split()
    for i, w in enumerate(words):
        clean_w = w.strip('.,!?;:"""()[]').lower()
        clean_word = word.strip('.,!?;:"""()[]').lower()
        if clean_word in clean_w or clean_w in clean_word:
            return i
    return -1


def create_sentence_entry(sentence, translation, word, sentence_id,
                         difficulty, domain, translation_lang):
    """Create a properly formatted sentence entry."""
    return {
        "id": sentence_id,
        "sentence": sentence,
        "translation": translation,
        "translation_language": translation_lang,
        "target_word": word,
        "target_index": find_word_in_sentence(sentence, word),
        "difficulty": difficulty,
        "domain": domain
    }


def generate_sentence_for_word(word_data, lang_name, level, domain):
    """
    This function will be called by Claude Code to generate a sentence.
    Return: {"sentence": "...", "translation": "..."}
    """
    # This is a placeholder - Claude Code will fill this in during execution
    return {
        "sentence": f"GENERATED_SENTENCE_FOR_{word_data['word']}",
        "translation": f"GENERATED_TRANSLATION"
    }


def process_vocabulary_file(config, generate_func=None):
    """Process a vocabulary configuration and generate sentence file."""

    print(f"\n{'='*70}")
    print(f"Processing: {config['name']}")
    print(f"{'='*70}")

    # Load vocabulary
    vocab = []
    for file_path in config['source_files']:
        with open(file_path, 'r', encoding='utf-8') as f:
            vocab.extend(json.load(f))

    print(f"Loaded {len(vocab)} words from {len(config['source_files'])} file(s)")

    # Build output structure
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
    generated_count = 0
    extracted_count = 0

    for idx, word_data in enumerate(vocab, 1):
        word = word_data['word']
        examples = word_data.get('examples', {})

        sentences = []
        sentence_num = 0

        # Extract existing examples
        for lang_code in config['translation_langs']:
            if lang_code in examples and isinstance(examples[lang_code], list):
                if len(examples[lang_code]) >= 2:
                    sentence_id = f"{config['language']}_{idx:03d}_{sentence_num + 1:03d}"
                    difficulty = "basic" if sentence_num == 0 else "intermediate"

                    entry = create_sentence_entry(
                        sentence=examples[lang_code][0],
                        translation=examples[lang_code][1],
                        word=word,
                        sentence_id=sentence_id,
                        difficulty=difficulty,
                        domain=config['domain'],
                        translation_lang=lang_code
                    )
                    sentences.append(entry)
                    sentence_num += 1
                    extracted_count += 1

                    if sentence_num >= 2:
                        break

        # Generate 3rd sentence if needed
        while sentence_num < 3:
            sentence_id = f"{config['language']}_{idx:03d}_{sentence_num + 1:03d}"

            if generate_func:
                # Call generation function (provided by Claude Code)
                generated = generate_func(word_data, config['language_name'],
                                         config['level'], config['domain'])

                entry = create_sentence_entry(
                    sentence=generated['sentence'],
                    translation=generated['translation'],
                    word=word,
                    sentence_id=sentence_id,
                    difficulty="advanced",
                    domain=config['domain'],
                    translation_lang=config['gen_lang']
                )
                sentences.append(entry)
                generated_count += 1
            else:
                # Placeholder
                sentences.append({
                    "id": sentence_id,
                    "sentence": "[GENERATE]",
                    "translation": "[GENERATE]",
                    "translation_language": config['gen_lang'],
                    "target_word": word,
                    "target_index": -1,
                    "difficulty": "advanced",
                    "domain": config['domain']
                })

            sentence_num += 1

        output['sentences'][word] = sentences

        # Progress indicator
        if idx % 30 == 0:
            print(f"  Progress: {idx}/{len(vocab)} words processed")

    # Save output
    os.makedirs(os.path.dirname(config['output_file']), exist_ok=True)
    with open(config['output_file'], 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"✅ Created: {config['output_file']}")
    print(f"   Words: {len(vocab)}")
    print(f"   Extracted: {extracted_count} sentences")
    print(f"   Generated: {generated_count} sentences")
    print(f"   Total: {extracted_count + generated_count} sentences")

    return output


def main():
    """Main entry point."""
    base_dir = "/Users/eldiaploo/Desktop/LingXM-Personal"

    configs = [
        {
            "name": "Arabic C1-C2 (Hassan)",
            "language": "ar",
            "language_name": "Arabic",
            "level": "C1-C2",
            "source_profiles": ["hassan"],
            "source_files": [f"{base_dir}/public/data/hassan/ar.json"],
            "output_file": f"{base_dir}/public/data/sentences/ar/ar-c1c2-sentences.json",
            "translation_langs": ["en", "ar"],
            "gen_lang": "en",
            "domain": "professional",
            "notes": "Generated from Hassan's C1-C2 Arabic vocabulary. Professional and business contexts for advanced learners."
        },
        {
            "name": "French B1-B2 Gastronomy (Salman + Jawad)",
            "language": "fr",
            "language_name": "French",
            "level": "B1-B2",
            "source_profiles": ["salman", "jawad"],
            "source_files": [
                f"{base_dir}/public/data/salman/fr.json",
                f"{base_dir}/public/data/jawad/fr.json"
            ],
            "output_file": f"{base_dir}/public/data/sentences/fr/fr-b1b2-gastro-sentences.json",
            "translation_langs": ["ar", "de"],
            "gen_lang": "ar",
            "domain": "gastronomy",
            "notes": "Generated from Salman and Jawad's B1-B2 French gastronomy vocabulary. Focus on culinary terms and cooking contexts."
        },
        {
            "name": "Italian A1 (Ameeno)",
            "language": "it",
            "language_name": "Italian",
            "level": "A1",
            "source_profiles": ["ameeno"],
            "source_files": [f"{base_dir}/public/data/ameeno/it.json"],
            "output_file": f"{base_dir}/public/data/sentences/it/it-a1-sentences.json",
            "translation_langs": ["fa", "en"],
            "gen_lang": "en",
            "domain": "basic",
            "notes": "Generated from Ameeno's A1 Italian vocabulary. Basic phrases and everyday contexts for beginners."
        }
    ]

    print("🚀 Multilingual Sentence Generation")
    print("="*70)

    for config in configs:
        # Process without generation function to create templates
        process_vocabulary_file(config, generate_func=None)

    print("\n" + "="*70)
    print("✅ Template files created!")
    print("   Next: Fill in [GENERATE] placeholders with actual sentences")
    print("="*70)


if __name__ == "__main__":
    main()
