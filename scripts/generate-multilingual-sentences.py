#!/usr/bin/env python3
"""
Generate multilingual sentence practice files from vocabulary sources.
"""

import json
import os
from datetime import date
from typing import Dict, List, Any
import anthropic


def load_vocabulary(file_path: str) -> List[Dict[str, Any]]:
    """Load vocabulary from JSON file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def merge_vocabularies(file_paths: List[str]) -> List[Dict[str, Any]]:
    """Merge multiple vocabulary files."""
    merged = []
    for path in file_paths:
        vocab = load_vocabulary(path)
        merged.extend(vocab)
    return merged


def generate_sentence_with_claude(word_data: Dict[str, Any], target_lang: str,
                                   translation_langs: List[str], level: str,
                                   domain: str, client: anthropic.Anthropic) -> Dict[str, Any]:
    """Generate a new sentence using Claude API."""

    word = word_data['word']
    translations = word_data['translations']

    # Build translation info
    trans_info = "\n".join([f"- {lang}: {trans}" for lang, trans in translations.items()])

    prompt = f"""Generate ONE new example sentence for the word "{word}" in {target_lang}.

Word: {word}
Translations:
{trans_info}

Level: {level}
Domain: {domain}

Create a sentence that:
1. Uses the word naturally in context
2. Is appropriate for {level} level learners
3. Relates to {domain} topics
4. Is educational and practical

Return ONLY a JSON object with this exact structure:
{{
  "sentences": {{
    "{translation_langs[0]}": ["sentence in {translation_langs[0]}", "translation"],
    "{translation_langs[1]}": ["sentence in {translation_langs[1]}", "translation"]
  }}
}}

Make sure the sentence is natural and demonstrates proper usage of the word."""

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}]
    )

    response_text = message.content[0].text.strip()

    # Extract JSON from response
    if '```json' in response_text:
        response_text = response_text.split('```json')[1].split('```')[0].strip()
    elif '```' in response_text:
        response_text = response_text.split('```')[1].split('```')[0].strip()

    return json.loads(response_text)


def create_sentence_entry(sentence_data: List[str], word: str, sentence_id: str,
                         index: int, difficulty: str, domain: str, lang_code: str) -> Dict[str, Any]:
    """Create a sentence entry with translations."""
    full_sentence = sentence_data[0]
    translation = sentence_data[1]

    # Find word position (approximate)
    words = full_sentence.split()
    target_index = -1
    for i, w in enumerate(words):
        if word.lower() in w.lower():
            target_index = i
            break

    return {
        "id": sentence_id,
        "sentence": full_sentence,
        "translation": translation,
        "target_word": word,
        "target_index": target_index,
        "difficulty": difficulty,
        "domain": domain
    }


def generate_sentences_for_config(config: Dict[str, Any], client: anthropic.Anthropic) -> None:
    """Generate sentences for a specific configuration."""

    print(f"\n{'='*60}")
    print(f"Generating {config['name']}")
    print(f"{'='*60}")

    # Load vocabulary
    vocab = merge_vocabularies(config['source_files'])
    print(f"Loaded {len(vocab)} words")

    # Prepare output structure
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
        print(f"Processing {idx}/{len(vocab)}: {word}")

        sentences = []

        # Get existing examples from the vocabulary
        examples = word_data.get('examples', {})

        # Extract sentences from existing examples
        sentence_count = 0
        for lang in config['translation_langs']:
            if lang in examples and len(examples[lang]) >= 2:
                # Each example is [sentence, translation]
                sentence_data = examples[lang]
                sentence_id = f"{config['language']}_{word.replace(' ', '_').replace(',', '')}_{sentence_count + 1:03d}"

                difficulty = "basic" if sentence_count == 0 else "intermediate" if sentence_count == 1 else "advanced"

                entry = create_sentence_entry(
                    sentence_data,
                    word,
                    sentence_id,
                    sentence_count,
                    difficulty,
                    config['domain'],
                    config['language']
                )
                entry['translation_language'] = lang
                sentences.append(entry)
                sentence_count += 1

                if sentence_count >= 2:
                    break

        # If we need more sentences, generate with Claude
        while sentence_count < 3:
            print(f"  Generating sentence {sentence_count + 1}/3...")
            try:
                generated = generate_sentence_with_claude(
                    word_data,
                    config['language_name'],
                    config['translation_langs'],
                    config['level'],
                    config['domain'],
                    client
                )

                # Use first available translation
                for lang in config['translation_langs']:
                    if lang in generated.get('sentences', {}):
                        sentence_data = generated['sentences'][lang]
                        sentence_id = f"{config['language']}_{word.replace(' ', '_').replace(',', '')}_{sentence_count + 1:03d}"

                        difficulty = "advanced" if sentence_count == 2 else "intermediate"

                        entry = create_sentence_entry(
                            sentence_data,
                            word,
                            sentence_id,
                            sentence_count,
                            difficulty,
                            config['domain'],
                            config['language']
                        )
                        entry['translation_language'] = lang
                        sentences.append(entry)
                        sentence_count += 1
                        break
            except Exception as e:
                print(f"  Error generating sentence: {e}")
                # Create a placeholder if generation fails
                sentence_count += 1

        output['sentences'][word] = sentences

    # Write output file
    os.makedirs(os.path.dirname(config['output_file']), exist_ok=True)
    with open(config['output_file'], 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n✓ Generated {config['output_file']}")
    print(f"  Total words: {len(vocab)}")
    print(f"  Total sentences: {len(vocab) * 3}")


def main():
    """Main function to generate all sentence files."""

    # Initialize Claude client
    api_key = os.environ.get('ANTHROPIC_API_KEY')
    if not api_key:
        print("Error: ANTHROPIC_API_KEY environment variable not set")
        return

    client = anthropic.Anthropic(api_key=api_key)

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
            "domain": "professional, business, advanced discourse",
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
            "translation_langs": ["ar", "fr"],
            "domain": "French gastronomy, cuisine, cooking",
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
            "domain": "basic Italian, greetings, simple phrases",
            "notes": "Generated from Ameeno's A1 Italian vocabulary. Basic phrases and everyday contexts for beginners."
        }
    ]

    for config in configs:
        generate_sentences_for_config(config, client)

    print("\n" + "="*60)
    print("All sentence files generated successfully!")
    print("="*60)


if __name__ == "__main__":
    main()
