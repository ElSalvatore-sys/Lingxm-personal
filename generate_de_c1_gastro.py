#!/usr/bin/env python3
"""
Generate German C1 Gastronomy Sentences for Jawad
=================================================
Generates 540 professional haute cuisine sentences (3 per word × 180 words)
with German and Arabic translations.

Requirements:
- 15-22 words per sentence
- C1 complexity with sophisticated structures
- Professional culinary terminology
- Context tags: haute_cuisine, wine_pairing, molecular_gastronomy, etc.
"""

import json
import os
import re
import time
from datetime import datetime
from anthropic import Anthropic

# Initialize Anthropic client
client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

# Paths
VOCAB_FILE = "public/data/jawad/de-gastro.json"
OUTPUT_FILE = "public/data/sentences/de-specialized/de-c1-gastro-sentences.json"

# Context categories for gastronomy
GASTRO_CONTEXTS = [
    "haute_cuisine",
    "wine_pairing",
    "molecular_gastronomy",
    "menu_composition",
    "professional_kitchen",
    "sensory_analysis",
    "culinary_technique",
    "ingredient_selection"
]


def load_vocabulary():
    """Load vocabulary from de-gastro.json"""
    with open(VOCAB_FILE, 'r', encoding='utf-8') as f:
        vocab = json.load(f)
    print(f"✓ Loaded {len(vocab)} words from {VOCAB_FILE}")
    return vocab


def validate_sentence_quality(sentence_de):
    """
    Validate German sentence for common C1 gastronomy errors.
    Returns (is_valid, error_message)
    """
    # Check for nonsense patterns
    nonsense_patterns = [
        r'\b(sollte|muss|kann)\s+(aromatisch|raffiniert|delikat|exquisit)\s+(das|die|der)',
        r'\bDas\s+(raffiniert|exquisit|delikat|aromatisch)\s+(ist|muss|sollte)',
        r'\bDie\s+(delikat|exquisit|aromatisch)\s*$',
        r'\b(aromatisch|raffiniert|delikat)\s+(ist|muss)\s+(das|die)',
    ]

    for pattern in nonsense_patterns:
        if re.search(pattern, sentence_de, re.IGNORECASE):
            return False, f"Nonsense pattern detected: {pattern}"

    # Check word count (15-22 words for C1)
    word_count = len(sentence_de.split())
    if word_count < 15 or word_count > 22:
        return False, f"Word count {word_count} outside range (15-22)"

    return True, ""


def generate_sentences_for_word(word_obj, word_index, total_words):
    """
    Generate 3 sentences for a single vocabulary word.
    Returns list of 3 sentence objects.
    """
    word = word_obj['word']
    word_translation_ar = word_obj['translations']['ar']
    explanation_de = word_obj['explanation']['de']
    explanation_ar = word_obj['explanation']['ar']

    print(f"\n[{word_index + 1}/{total_words}] Generating for: {word}")

    # Create the prompt for Claude
    prompt = f"""Generate exactly 3 professional German C1-level gastronomy sentences for the word "{word}".

WORD CONTEXT:
- German: {word}
- Arabic: {word_translation_ar}
- Explanation (DE): {explanation_de}
- Explanation (AR): {explanation_ar}

REQUIREMENTS:
1. **Sentence Length**: 15-22 words per sentence
2. **C1 Complexity**: Use subordinate clauses, sophisticated grammar structures
3. **Professional Level**: Haute cuisine, Sterneküche, professional chef vocabulary
4. **Natural German**: NO adjectives as verbs! NO adjectives as nouns! Proper syntax only!
5. **Three Aspects**:
   - Sentence 1: TECHNICAL (preparation/technique)
   - Sentence 2: SENSORY (taste/aroma/presentation)
   - Sentence 3: CONCEPTUAL (composition/philosophy/pairing)

CONTEXT CATEGORIES (assign one per sentence):
- haute_cuisine, wine_pairing, molecular_gastronomy, menu_composition, professional_kitchen, sensory_analysis, culinary_technique, ingredient_selection

BAD EXAMPLES (NEVER DO THIS):
❌ "Das raffiniert muss bringen das exquisit." (nonsense!)
❌ "Sollte aromatisch das Gericht." (adjective as verb!)
❌ "Die delikat ist essenziell." (adjective as noun!)

GOOD EXAMPLES:
✅ "Die Reduktion der Sauce erfordert präzises Timing und konstante Temperaturkontrolle, um die gewünschte Konsistenz zu erreichen."
✅ "Der Sommelier empfiehlt einen burgundischen Pinot Noir, dessen erdige Noten perfekt mit dem Wild harmonieren."
✅ "Die Komposition des Gerichts vereint klassische französische Techniken mit Elementen der modernen Molekulargastronomie."

OUTPUT FORMAT (JSON):
{{
  "sentences": [
    {{
      "de": {{
        "full": "Complete German sentence (15-22 words)",
        "target_word": "{word}",
        "target_index": <position of word in sentence, 0-based>
      }},
      "ar": {{
        "full": "Complete Arabic translation",
        "target_word": "{word_translation_ar}",
        "target_index": <position of word in Arabic sentence, 0-based>
      }},
      "difficulty": "basic|intermediate|advanced",
      "context": "<one of the context categories>",
      "vocabulary_used": ["{word}", "other C1 words used"]
    }},
    // 2 more sentences...
  ]
}}

IMPORTANT:
- Generate EXACTLY 3 sentences
- Each sentence MUST be natural, grammatically perfect German
- Each sentence MUST be 15-22 words
- Each sentence MUST use "{word}" naturally
- Difficulty: "basic"=simpler C1, "intermediate"=moderate C1, "advanced"=complex C1
- Return ONLY valid JSON, no markdown code blocks"""

    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = client.messages.create(
                model="claude-sonnet-4-5-20250929",
                max_tokens=2000,
                temperature=0.8,
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )

            # Extract JSON from response
            content = response.content[0].text.strip()

            # Remove markdown code blocks if present
            content = re.sub(r'^```json\s*', '', content)
            content = re.sub(r'^```\s*', '', content)
            content = re.sub(r'\s*```$', '', content)

            # Parse JSON
            result = json.loads(content)
            sentences = result.get('sentences', [])

            if len(sentences) != 3:
                raise ValueError(f"Expected 3 sentences, got {len(sentences)}")

            # Validate each sentence
            valid_sentences = []
            for i, sent in enumerate(sentences):
                de_full = sent['de']['full']
                is_valid, error = validate_sentence_quality(de_full)

                if not is_valid:
                    print(f"  ⚠ Sentence {i+1} validation failed: {error}")
                    if attempt < max_retries - 1:
                        print(f"  → Retrying (attempt {attempt + 2}/{max_retries})...")
                        time.sleep(1)
                        break
                    else:
                        raise ValueError(f"Validation failed after {max_retries} attempts: {error}")

                valid_sentences.append(sent)

            if len(valid_sentences) == 3:
                print(f"  ✓ Generated 3 valid sentences")
                return valid_sentences

        except Exception as e:
            print(f"  ✗ Error (attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                time.sleep(2)
            else:
                raise

    raise Exception(f"Failed to generate sentences for {word} after {max_retries} attempts")


def generate_all_sentences(vocab_list):
    """
    Generate sentences for all vocabulary words.
    Returns dictionary structure: {word: [sentences]}
    """
    all_sentences = {}
    total_words = len(vocab_list)

    print(f"\n{'='*60}")
    print(f"GENERATING 540 SENTENCES ({total_words} words × 3 sentences)")
    print(f"{'='*60}")

    sentence_id_counter = 1

    # Process in batches of 60 for validation checkpoints
    batch_size = 60
    for batch_start in range(0, total_words, batch_size):
        batch_end = min(batch_start + batch_size, total_words)
        batch = vocab_list[batch_start:batch_end]

        print(f"\n{'─'*60}")
        print(f"BATCH: Words {batch_start + 1} to {batch_end} ({len(batch)} words)")
        print(f"{'─'*60}")

        for i, word_obj in enumerate(batch):
            word = word_obj['word']
            actual_index = batch_start + i

            try:
                sentences = generate_sentences_for_word(word_obj, actual_index, total_words)

                # Add IDs to sentences
                word_sentences = []
                for sent in sentences:
                    sent_with_id = {
                        "id": f"de_c1_gastro_{sentence_id_counter:04d}",
                        **sent,
                        "domain": "gastronomy"
                    }

                    # Create blank versions
                    de_full = sent['de']['full']
                    de_target = sent['de']['target_word']
                    de_blank = de_full.replace(de_target, "_____", 1)
                    sent_with_id['de']['blank'] = de_blank

                    ar_full = sent['ar']['full']
                    ar_target = sent['ar']['target_word']
                    ar_blank = ar_full.replace(ar_target, "_____", 1)
                    sent_with_id['ar']['blank'] = ar_blank

                    word_sentences.append(sent_with_id)
                    sentence_id_counter += 1

                all_sentences[word] = word_sentences

                # Brief pause to avoid rate limiting
                time.sleep(0.5)

            except Exception as e:
                print(f"\n✗ FATAL ERROR for word '{word}': {e}")
                print(f"Stopping at word {actual_index + 1}/{total_words}")
                raise

        # Validation checkpoint after each batch
        print(f"\n{'='*60}")
        print(f"BATCH VALIDATION CHECKPOINT ({batch_end} words completed)")
        print(f"{'='*60}")
        batch_count = len([s for word in batch if word['word'] in all_sentences for s in all_sentences[word['word']]])
        print(f"✓ Batch sentences generated: {batch_count}")
        print(f"✓ Total sentences so far: {sentence_id_counter - 1}")

    return all_sentences


def save_output(sentences_dict, vocab_list):
    """Save sentences to JSON file with metadata"""

    # Create metadata
    metadata = {
        "language": "de",
        "language_name": "German",
        "source_profile": "jawad",
        "source_level": "C1",
        "source_vocabulary": VOCAB_FILE,
        "total_words": len(vocab_list),
        "total_sentences": sum(len(sents) for sents in sentences_dict.values()),
        "generated_date": datetime.now().strftime("%Y-%m-%d"),
        "version": "1.0",
        "generator": "Claude Code",
        "model": "claude-sonnet-4-5-20250929",
        "domain": "gastronomy",
        "translations": ["ar", "de"],
        "notes": "Professional German C1-level gastronomy sentences with Arabic translations. Covers haute cuisine, wine pairing, molecular gastronomy, and culinary techniques. 3 sentences per word focusing on technical, sensory, and conceptual aspects."
    }

    # Create output structure
    output = {
        "metadata": metadata,
        "sentences": sentences_dict
    }

    # Ensure output directory exists
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

    # Save to file
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*60}")
    print(f"✓ SAVED: {OUTPUT_FILE}")
    print(f"{'='*60}")
    print(f"Total words: {metadata['total_words']}")
    print(f"Total sentences: {metadata['total_sentences']}")
    print(f"Generated: {metadata['generated_date']}")


def display_random_examples(sentences_dict, count=20):
    """Display random sentence examples"""
    import random

    # Flatten all sentences
    all_sents = []
    for word, sents in sentences_dict.items():
        for sent in sents:
            all_sents.append((word, sent))

    # Sample random sentences
    samples = random.sample(all_sents, min(count, len(all_sents)))

    print(f"\n{'='*60}")
    print(f"20 RANDOM HAUTE CUISINE EXAMPLES")
    print(f"{'='*60}\n")

    for i, (word, sent) in enumerate(samples, 1):
        print(f"{i}. [{word}] ({sent['context']}, {sent['difficulty']})")
        print(f"   DE: {sent['de']['full']}")
        print(f"   AR: {sent['ar']['full']}")
        print()


def main():
    """Main execution"""
    print("\n" + "="*60)
    print("GERMAN C1 GASTRONOMY SENTENCE GENERATOR")
    print("="*60)

    # Load vocabulary
    vocab = load_vocabulary()

    if len(vocab) != 180:
        print(f"⚠ WARNING: Expected 180 words, found {len(vocab)}")

    # Generate all sentences
    sentences = generate_all_sentences(vocab)

    # Save output
    save_output(sentences, vocab)

    # Display examples
    display_random_examples(sentences, 20)

    print("\n" + "="*60)
    print("✓ GENERATION COMPLETE!")
    print("="*60)
    print(f"Output: {OUTPUT_FILE}")
    print(f"Total: 540 professional haute cuisine sentences")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
