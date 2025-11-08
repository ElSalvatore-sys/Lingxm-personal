#!/usr/bin/env python3
"""
Generate 540 perfect Italian A1 sentences for Ameeno (complete beginner).
3 sentences per word from 180 Italian A1 vocabulary words.
"""

import json
import os
import re
import time
import anthropic

def load_vocabulary(file_path):
    """Load Italian vocabulary words."""
    with open(file_path, 'r', encoding='utf-8') as f:
        vocab = json.load(f)
    return vocab

def validate_italian_grammar(sentence):
    """
    Validate Italian grammar rules to avoid common mistakes.
    Returns (is_valid, error_message)
    """
    # Check for adverbs used as nouns (CRITICAL ERROR)
    adverb_as_noun_patterns = [
        r'\b(un|il|lo|la|i|gli|le)\s+(mai|sempre|spesso|raramente|ieri|oggi|domani|presto|tardi|bene|male|molto|poco)\b',
        r'\bmio\s+(perché|quando|dove|come|mai|sempre)\b',
        r'\bmi piace il\s+(blu|rosso|verde|giallo|felice|triste|grande|piccolo)\s*[.,!?]?\s*$'
    ]

    for pattern in adverb_as_noun_patterns:
        if re.search(pattern, sentence, re.IGNORECASE):
            return False, f"Adverb/adjective used as noun: {pattern}"

    # Check for reasonable sentence length (5-10 words)
    words = sentence.split()
    if len(words) < 5 or len(words) > 10:
        return False, f"Sentence length {len(words)} words (should be 5-10)"

    return True, "OK"

def generate_sentences_for_word(word, word_data, all_words, client):
    """
    Generate 3 perfect Italian A1 sentences for a single word.

    Args:
        word: The target Italian word
        word_data: Dictionary containing translations, explanations, examples
        all_words: List of all 180 words (for i+1 context)
        client: Anthropic client instance

    Returns:
        List of 3 sentence dictionaries
    """

    # Get English translation
    en_translation = word_data.get('translations', {}).get('en', word)

    # Create prompt for Claude
    prompt = f"""Generate 3 PERFECT Italian A1 sentences for the word "{word}" ({en_translation}).

CRITICAL ITALIAN GRAMMAR RULES:
❌ NEVER use adverbs as nouns: "Vedo un mai" is WRONG!
❌ NEVER use conjunctions as nouns: "Questo è mio perché" is WRONG!
❌ NEVER use adjectives alone without nouns: "Mi piace il blu" is WRONG! Say "Mi piace il colore blu" instead.
✅ Adverbs modify verbs: "Non lavoro mai la domenica" is CORRECT!
✅ Use articles with nouns only: "il libro", "la casa", "un amico"

REQUIREMENTS:
- 5-10 words per sentence
- Present tense primarily
- Simple, natural Italian
- i+1 principle: 90% known words, +1 new word
- Context: everyday life, family, food, basic activities
- Each sentence MUST naturally use "{word}"

Generate 3 sentences:
1. A declarative sentence (statement)
2. An everyday context sentence
3. A simple question

EXAMPLES OF GOOD SENTENCES:
- "Mangio la colazione ogni mattina."
- "Mio padre lavora in ufficio."
- "Bevo acqua tutti i giorni."
- "Quando vai al mercato?"

EXAMPLES OF BAD SENTENCES (DO NOT DO THIS):
- "Vedo un mai." ❌ (adverb as noun!)
- "Questo è mio perché." ❌ (conjunction as noun!)
- "Mi piace il blu." ❌ (adjective without noun!)

Return JSON array with 3 objects, each containing:
- "it": Italian sentence
- "en": English translation

Example format:
[
  {{"it": "Mangio la pasta ogni sera.", "en": "I eat pasta every evening."}},
  {{"it": "La pasta italiana è molto buona.", "en": "Italian pasta is very good."}},
  {{"it": "Ti piace la pasta?", "en": "Do you like pasta?"}}
]
"""

    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2048,
                temperature=0.7,
                system="You are an expert Italian language teacher who creates perfect A1-level sentences following strict Italian grammar rules. Always respond with valid JSON.",
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            content = response.content[0].text

            # Add small delay to avoid rate limiting
            time.sleep(0.5)

            # Parse JSON response
            try:
                data = json.loads(content)
                # Handle different response formats
                if isinstance(data, list):
                    sentences = data
                elif 'sentences' in data:
                    sentences = data['sentences']
                else:
                    # Assume the response is wrapped in an object, find the array
                    for key, value in data.items():
                        if isinstance(value, list):
                            sentences = value
                            break
                    else:
                        raise ValueError("Could not find sentence array in response")
            except json.JSONDecodeError as e:
                print(f"  ⚠️  JSON parse error for '{word}': {e}")
                continue

            # Validate all sentences
            valid_sentences = []
            for i, sentence_obj in enumerate(sentences):
                if not isinstance(sentence_obj, dict) or 'it' not in sentence_obj:
                    continue

                it_sentence = sentence_obj['it'].strip()
                en_translation = sentence_obj.get('en', '').strip()

                # Validate Italian grammar
                is_valid, error_msg = validate_italian_grammar(it_sentence)
                if not is_valid:
                    print(f"  ⚠️  Grammar validation failed for '{word}' sentence {i+1}: {error_msg}")
                    print(f"      Sentence: {it_sentence}")
                    continue

                valid_sentences.append({
                    "it": it_sentence,
                    "en": en_translation,
                    "word": word
                })

            # If we got 3 valid sentences, return them
            if len(valid_sentences) == 3:
                return valid_sentences
            elif len(valid_sentences) > 3:
                return valid_sentences[:3]
            else:
                print(f"  ⚠️  Only got {len(valid_sentences)}/3 valid sentences for '{word}', retrying...")
                continue

        except Exception as e:
            print(f"  ❌ Error generating sentences for '{word}' (attempt {attempt+1}): {e}")
            if attempt == max_retries - 1:
                raise
            continue

    # If we get here, we failed to generate 3 valid sentences
    raise Exception(f"Failed to generate 3 valid sentences for '{word}' after {max_retries} attempts")

def main():
    print("🇮🇹 Italian A1 Sentence Generator")
    print("=" * 50)

    # Initialize Anthropic client
    api_key = os.environ.get('ANTHROPIC_API_KEY')
    if not api_key:
        print("❌ Error: ANTHROPIC_API_KEY environment variable not set")
        print("   Please set it with: export ANTHROPIC_API_KEY='your-key-here'")
        return

    client = anthropic.Anthropic(api_key=api_key)
    print("✅ Anthropic client initialized")

    # Load vocabulary
    vocab_file = '/Users/eldiaploo/Desktop/LingXM-Personal/public/data/ameeno/it.json'
    print(f"\n📖 Loading vocabulary from {vocab_file}...")
    vocabulary = load_vocabulary(vocab_file)
    print(f"   ✅ Loaded {len(vocabulary)} Italian words")

    # Extract word list for i+1 context
    all_words = [item['word'] for item in vocabulary]

    # Generate sentences
    print(f"\n🔨 Generating 3 sentences per word (540 total)...")
    all_sentences = []

    for idx, word_data in enumerate(vocabulary, 1):
        word = word_data['word']
        print(f"\n[{idx}/180] Generating sentences for '{word}'...")

        try:
            sentences = generate_sentences_for_word(word, word_data, all_words, client)
            all_sentences.extend(sentences)
            print(f"   ✅ Generated 3 sentences ({len(all_sentences)} total)")

            # Quality check every 60 words (180 sentences)
            if idx % 60 == 0:
                print(f"\n🔍 Quality Check at {idx} words ({len(all_sentences)} sentences)")
                print("   Running grammar validation...")

                # Check for common errors
                error_count = 0
                for sent in all_sentences[-180:]:  # Check last 180 sentences
                    is_valid, error_msg = validate_italian_grammar(sent['it'])
                    if not is_valid:
                        print(f"   ⚠️  {sent['it']} - {error_msg}")
                        error_count += 1

                if error_count == 0:
                    print("   ✅ All sentences passed validation!")
                else:
                    print(f"   ⚠️  Found {error_count} validation warnings")

        except Exception as e:
            print(f"   ❌ Failed to generate sentences for '{word}': {e}")
            # Continue with next word rather than failing completely
            continue

    # Save to file
    output_file = '/Users/eldiaploo/Desktop/LingXM-Personal/public/data/sentences/it/it-a1-sentences.json'
    print(f"\n💾 Saving {len(all_sentences)} sentences to {output_file}...")

    os.makedirs(os.path.dirname(output_file), exist_ok=True)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_sentences, f, ensure_ascii=False, indent=2)

    print(f"   ✅ Saved successfully!")

    # Final validation
    print(f"\n✅ GENERATION COMPLETE!")
    print(f"   Total sentences: {len(all_sentences)}")
    print(f"   Target: 540 sentences (3 per word × 180 words)")

    # Show 20 random examples
    import random
    print(f"\n📝 20 RANDOM EXAMPLES:")
    random_samples = random.sample(all_sentences, min(20, len(all_sentences)))
    for i, sample in enumerate(random_samples, 1):
        print(f"{i:2d}. 🇮🇹 {sample['it']}")
        print(f"    🇬🇧 {sample['en']}")
        print(f"    📌 Word: {sample['word']}")

    print(f"\n📂 Output file: {output_file}")
    print("\n✨ Done!")

if __name__ == "__main__":
    main()
