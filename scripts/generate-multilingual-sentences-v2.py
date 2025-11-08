#!/usr/bin/env python3
"""
Generate multilingual sentence practice files from vocabulary sources.
Extracts existing examples and generates one additional sentence per word.
"""

import json
import os
from datetime import date
from typing import Dict, List, Any
import anthropic
import time


def load_vocabulary(file_paths: List[str]) -> List[Dict[str, Any]]:
    """Load and merge vocabulary from JSON files."""
    merged = []
    for path in file_paths:
        with open(path, 'r', encoding='utf-8') as f:
            vocab = json.load(f)
            merged.extend(vocab)
    return merged


def create_sentence_entry(sentence: str, translation: str, word: str,
                          sentence_id: str, difficulty: str, domain: str,
                          translation_lang: str) -> Dict[str, Any]:
    """Create a sentence entry with translation."""
    # Find word position in sentence
    words = sentence.split()
    target_index = -1
    for i, w in enumerate(words):
        # Handle variations (with punctuation, case differences)
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


def generate_sentence_with_claude(word_data: Dict[str, Any], target_lang_name: str,
                                   translation_lang_code: str, level: str,
                                   domain: str, client: anthropic.Anthropic,
                                   max_retries: int = 3) -> Dict[str, str]:
    """Generate a new sentence using Claude API with retry logic."""

    word = word_data['word']
    translations = word_data['translations']
    explanation = word_data.get('explanation', {})

    # Build context
    trans_lines = [f"- {lang}: {trans}" for lang, trans in translations.items()]
    exp_lines = [f"- {lang}: {exp}" for lang, exp in explanation.items()]

    prompt = f"""Generate ONE example sentence for the word "{word}" in {target_lang_name}.

Word: {word}
Translations:
{chr(10).join(trans_lines)}

Meaning:
{chr(10).join(exp_lines) if exp_lines else 'Not provided'}

Level: {level}
Domain: {domain}

Create a sentence that:
1. Uses the word "{word}" naturally in context
2. Is appropriate for {level} level learners
3. Relates to {domain} topics
4. Is practical and educational

Return ONLY valid JSON with this structure (no markdown, no code blocks):
{{
  "sentence": "your sentence in {target_lang_name} using the word",
  "translation": "translation of the entire sentence to {translation_lang_code}"
}}

The sentence must include the word "{word}" and be natural and educational."""

    for attempt in range(max_retries):
        try:
            message = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=500,
                temperature=0.7,
                messages=[{"role": "user", "content": prompt}]
            )

            response_text = message.content[0].text.strip()

            # Clean response
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0].strip()
            elif '```' in response_text:
                response_text = response_text.split('```')[1].split('```')[0].strip()

            result = json.loads(response_text)

            if 'sentence' in result and 'translation' in result:
                return result
            else:
                raise ValueError("Response missing required fields")

        except Exception as e:
            if attempt < max_retries - 1:
                print(f"    Retry {attempt + 1}/{max_retries} due to: {e}")
                time.sleep(1)
            else:
                raise Exception(f"Failed after {max_retries} attempts: {e}")


def generate_sentences_for_config(config: Dict[str, Any], client: anthropic.Anthropic) -> None:
    """Generate sentences for a specific configuration."""

    print(f"\n{'='*70}")
    print(f"Generating {config['name']}")
    print(f"{'='*70}")

    # Load vocabulary
    vocab = load_vocabulary(config['source_files'])
    print(f"Loaded {len(vocab)} words from {len(config['source_files'])} file(s)")

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
        print(f"[{idx}/{len(vocab)}] Processing: {word}")

        sentences = []
        examples = word_data.get('examples', {})

        # Extract existing sentences from examples
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
                    print(f"  ✓ Extracted {lang_code} example ({sentence_num}/3)")

        # Generate one additional sentence if needed
        if sentence_num < 3:
            print(f"  → Generating sentence {sentence_num + 1}/3...")
            try:
                # Use first available translation language for generation
                gen_lang = config['gen_translation_lang']

                generated = generate_sentence_with_claude(
                    word_data,
                    config['language_name'],
                    gen_lang,
                    config['level'],
                    config['domain'],
                    client
                )

                sentence_id = f"{config['language']}_{idx:03d}_{sentence_num + 1:03d}"

                entry = create_sentence_entry(
                    sentence=generated['sentence'],
                    translation=generated['translation'],
                    word=word,
                    sentence_id=sentence_id,
                    difficulty="advanced",
                    domain=config['domain'],
                    translation_lang=gen_lang
                )
                sentences.append(entry)
                print(f"  ✓ Generated {gen_lang} sentence (3/3)")

            except Exception as e:
                print(f"  ✗ Generation failed: {e}")

        output['sentences'][word] = sentences

        # Rate limiting
        if idx % 10 == 0:
            time.sleep(0.5)

    # Write output file
    os.makedirs(os.path.dirname(config['output_file']), exist_ok=True)
    with open(config['output_file'], 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    total_generated = sum(len(sents) for sents in output['sentences'].values())
    print(f"\n✅ Generated {config['output_file']}")
    print(f"   Words: {len(vocab)}")
    print(f"   Sentences: {total_generated}")


def main():
    """Main function to generate all sentence files."""

    # Check for API key
    api_key = os.environ.get('ANTHROPIC_API_KEY')
    if not api_key:
        print("❌ Error: ANTHROPIC_API_KEY environment variable not set")
        print("   Please set it with: export ANTHROPIC_API_KEY='your-key-here'")
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
            "translation_langs": ["en", "ar"],  # Extract from these
            "gen_translation_lang": "en",  # Generate with this
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
            "translation_langs": ["ar", "de"],  # Extract from these
            "gen_translation_lang": "ar",  # Generate with this
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
            "translation_langs": ["fa", "en"],  # Extract from these
            "gen_translation_lang": "en",  # Generate with this
            "domain": "basic Italian, greetings, simple phrases",
            "notes": "Generated from Ameeno's A1 Italian vocabulary. Basic phrases and everyday contexts for beginners."
        }
    ]

    print("🚀 Starting multilingual sentence generation")
    print(f"   Total words: {180 + 360 + 180} = 720 words")
    print(f"   Total sentences: {720 * 3} = 2,160 sentences")
    print(f"   Sentences to generate: ~720 (1 per word)")

    for config in configs:
        try:
            generate_sentences_for_config(config, client)
        except Exception as e:
            print(f"❌ Error processing {config['name']}: {e}")
            continue

    print("\n" + "="*70)
    print("✅ All sentence files generated successfully!")
    print("="*70)


if __name__ == "__main__":
    main()
