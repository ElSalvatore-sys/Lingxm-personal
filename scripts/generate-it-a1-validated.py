#!/usr/bin/env python3
"""
Generate Italian A1 sentence practice file with quality validation.
Extracts existing examples and generates one additional sentence per word.
Includes Italian-specific grammar checks to avoid common errors.
"""

import json
import os
import re
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


def validate_italian_grammar(sentence: str, word: str) -> List[str]:
    """
    Validate Italian sentence for common grammar errors.
    Returns list of errors found.
    """
    errors = []

    # Check for adverbs/time words used as nouns after articles
    # e.g., "Vedo un mai" (I see a never) - WRONG!
    adverb_pattern = r'\b(un|una|il|lo|la|i|gli|le)\s+(mai|sempre|spesso|raramente|ieri|oggi|domani|presto|tardi)\b'
    if re.search(adverb_pattern, sentence, re.IGNORECASE):
        errors.append(f"Adverb/time word used as noun: {sentence}")

    # Check for conjunctions used as nouns
    # e.g., "Questo è mio perché" (This is my because) - WRONG!
    conjunction_pattern = r'\b(un|una|il|lo|la|mio|tuo|suo)\s+(perché|quando|dove|come|se|ma|quindi)\b'
    if re.search(conjunction_pattern, sentence, re.IGNORECASE):
        errors.append(f"Conjunction used as noun: {sentence}")

    # Check for adjectives used as standalone nouns without context
    # e.g., "Mi piace il blu" without "colore" - potentially WRONG (context-dependent)
    # This is a softer check - we'll flag it but not fail
    color_pattern = r'\b(il|lo|la)\s+(blu|rosso|verde|giallo|bianco|nero|rosa)\s*[.!?]?\s*$'
    if re.search(color_pattern, sentence, re.IGNORECASE):
        errors.append(f"WARNING: Color adjective might need noun: {sentence}")

    # Check for adjectives like "buono", "bello" used as standalone nouns
    adjective_standalone = r'\b(il|lo|la)\s+(buono|bello|brutto|grande|piccolo|felice|triste)\s*[.!?]?\s*$'
    if re.search(adjective_standalone, sentence, re.IGNORECASE):
        errors.append(f"WARNING: Adjective might need noun: {sentence}")

    return errors


def validate_sentence_length(sentence: str, min_words: int = 5, max_words: int = 10) -> bool:
    """Check if sentence is within A1 length requirements."""
    word_count = len(sentence.split())
    return min_words <= word_count <= max_words


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
    """Generate a new Italian A1 sentence using Claude API with retry logic."""

    word = word_data['word']
    translations = word_data['translations']
    explanation = word_data.get('explanation', {})

    # Build context
    trans_lines = [f"- {lang}: {trans}" for lang, trans in translations.items()]
    exp_lines = [f"- {lang}: {exp}" for lang, exp in explanation.items()]

    prompt = f"""Generate ONE example sentence for the Italian word "{word}" at A1 level.

Word: {word}
Translations:
{chr(10).join(trans_lines)}

Meaning:
{chr(10).join(exp_lines) if exp_lines else 'Not provided'}

Level: {level}
Domain: {domain}

**ITALIAN A1 REQUIREMENTS:**
1. Sentence length: 5-10 words only
2. Use present tense primarily (presente indicativo)
3. Simple, everyday vocabulary (famiglia, cibo, casa, lavoro)
4. Natural Italian - 90% known words + 1 new word (i+1 principle)
5. Use the word "{word}" naturally in context

**CRITICAL: Avoid these Italian grammar errors:**
- ❌ NEVER use adverbs/time words as nouns: "Vedo un mai" (WRONG!)
- ✅ Use adverbs correctly: "Non lavoro mai la domenica" (CORRECT!)
- ❌ NEVER use conjunctions as nouns: "Questo è mio perché" (WRONG!)
- ✅ Use conjunctions correctly: "Mangio perché ho fame" (CORRECT!)
- ❌ NEVER use adjectives alone as nouns: "Mi piace il blu" (WRONG!)
- ✅ Add the noun: "Mi piace il colore blu" (CORRECT!)

**Good A1 examples:**
- "Mangio la colazione ogni mattina." (7 words, present tense, simple)
- "Mio padre lavora in ufficio." (5 words, everyday context)
- "Bevo acqua tutti i giorni." (5 words, simple routine)

Return ONLY valid JSON with this structure (no markdown, no code blocks):
{{
  "sentence": "your Italian sentence using '{word}' (5-10 words, A1 level)",
  "translation": "English translation of the entire sentence"
}}

The sentence MUST:
- Include the word "{word}"
- Be 5-10 words long
- Use correct Italian grammar (articles with nouns, not adverbs!)
- Be natural and educational for A1 learners"""

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
                # Validate the generated sentence
                errors = validate_italian_grammar(result['sentence'], word)
                if errors:
                    # Filter out warnings, only fail on actual errors
                    critical_errors = [e for e in errors if not e.startswith("WARNING:")]
                    if critical_errors:
                        raise ValueError(f"Grammar validation failed: {critical_errors}")
                    else:
                        # Just warnings, log them but continue
                        for warning in errors:
                            print(f"    ⚠️  {warning}")

                # Check sentence length
                if not validate_sentence_length(result['sentence']):
                    word_count = len(result['sentence'].split())
                    print(f"    ⚠️  Sentence length {word_count} words (target: 5-10)")

                return result
            else:
                raise ValueError("Response missing required fields")

        except Exception as e:
            if attempt < max_retries - 1:
                print(f"    Retry {attempt + 1}/{max_retries} due to: {e}")
                time.sleep(1)
            else:
                raise Exception(f"Failed after {max_retries} attempts: {e}")


def run_validation_checkpoint(sentences: Dict[str, List[Dict]], checkpoint_num: int) -> None:
    """Run validation checks on generated sentences at checkpoints."""
    print(f"\n{'='*70}")
    print(f"VALIDATION CHECKPOINT #{checkpoint_num}")
    print(f"{'='*70}")

    all_sentences = []
    for word, sents in sentences.items():
        for sent in sents:
            all_sentences.append(sent['sentence'])

    total_errors = 0
    total_warnings = 0

    for sentence in all_sentences:
        errors = validate_italian_grammar(sentence, "")
        if errors:
            critical_errors = [e for e in errors if not e.startswith("WARNING:")]
            warnings = [e for e in errors if e.startswith("WARNING:")]
            total_errors += len(critical_errors)
            total_warnings += len(warnings)

            for error in critical_errors:
                print(f"❌ {error}")
            for warning in warnings:
                print(f"⚠️  {warning}")

    print(f"\nCheckpoint Results:")
    print(f"  Total sentences checked: {len(all_sentences)}")
    print(f"  Critical errors: {total_errors}")
    print(f"  Warnings: {total_warnings}")

    if total_errors > 0:
        print(f"\n⚠️  Found {total_errors} critical grammar errors!")
    else:
        print(f"\n✅ No critical grammar errors found!")


def generate_italian_a1_sentences(client: anthropic.Anthropic) -> None:
    """Generate Italian A1 sentences with validation."""

    base_dir = "/Users/eldiaploo/Desktop/LingXM-Personal"

    config = {
        "name": "Italian A1 (Ameeno)",
        "language": "it",
        "language_name": "Italian",
        "level": "A1",
        "source_profiles": ["ameeno"],
        "source_files": [f"{base_dir}/public/data/ameeno/it.json"],
        "output_file": f"{base_dir}/public/data/sentences/it/it-a1-sentences.json",
        "translation_langs": ["fa", "en"],  # Extract from these
        "gen_translation_lang": "en",  # Generate with this
        "domain": "basic",
        "notes": "Regenerated Italian A1 sentences with improved quality and grammar validation"
    }

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
            "version": "2.0",
            "generator": "Claude Code (Enhanced with Italian Grammar Validation)",
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

                    # Validate extracted sentence
                    errors = validate_italian_grammar(example[0], word)
                    if errors:
                        for error in errors:
                            if not error.startswith("WARNING:"):
                                print(f"  ❌ Extracted sentence error: {error}")

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
                generated = generate_sentence_with_claude(
                    word_data,
                    config['language_name'],
                    config['gen_translation_lang'],
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
                    translation_lang=config['gen_translation_lang']
                )
                sentences.append(entry)
                print(f"  ✓ Generated {config['gen_translation_lang']} sentence (3/3)")

            except Exception as e:
                print(f"  ✗ Generation failed: {e}")

        output['sentences'][word] = sentences

        # Validation checkpoint every 60 words
        if idx % 60 == 0:
            run_validation_checkpoint(output['sentences'], idx // 60)

        # Rate limiting
        if idx % 10 == 0:
            time.sleep(0.5)

    # Final validation
    print(f"\n{'='*70}")
    print("FINAL VALIDATION")
    print(f"{'='*70}")
    run_validation_checkpoint(output['sentences'], "FINAL")

    # Write output file
    os.makedirs(os.path.dirname(config['output_file']), exist_ok=True)
    with open(config['output_file'], 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    total_generated = sum(len(sents) for sents in output['sentences'].values())
    print(f"\n✅ Generated {config['output_file']}")
    print(f"   Words: {len(vocab)}")
    print(f"   Sentences: {total_generated}")


def main():
    """Main function to generate Italian A1 sentences."""

    # Check for API key
    api_key = os.environ.get('ANTHROPIC_API_KEY')
    if not api_key:
        print("❌ Error: ANTHROPIC_API_KEY environment variable not set")
        print("   Please set it with: export ANTHROPIC_API_KEY='your-key-here'")
        return

    client = anthropic.Anthropic(api_key=api_key)

    print("🚀 Starting Italian A1 sentence generation")
    print(f"   Total words: 180")
    print(f"   Total sentences: 540 (3 per word)")
    print(f"   Validation checkpoints: Every 60 words")

    try:
        generate_italian_a1_sentences(client)
        print("\n" + "="*70)
        print("✅ Italian A1 sentences generated successfully!")
        print("="*70)
    except Exception as e:
        print(f"❌ Error: {e}")
        raise


if __name__ == "__main__":
    main()
