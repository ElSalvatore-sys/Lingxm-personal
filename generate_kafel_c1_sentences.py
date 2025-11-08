#!/usr/bin/env python3
"""
Generate C1-level German sentences for Kafel (IT professional).
Uses Anthropic Claude API with strict C1 validation and quality checks.
"""

import json
import os
import re
from pathlib import Path
from anthropic import Anthropic
from datetime import date
import time

# Initialize Anthropic client
client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

def load_vocabulary(file_path):
    """Load vocabulary from JSON file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def normalize_word(word):
    """Normalize word for ID generation (remove spaces, lowercase)."""
    return word.lower().replace(' ', '_').replace('ä', 'ae').replace('ö', 'oe').replace('ü', 'ue').replace('ß', 'ss')

def validate_german_sentence(sentence):
    """
    Validate German sentence for common C1 errors.
    Returns (is_valid, error_message).
    """
    # Check for adjectives used as nouns/verbs incorrectly
    problematic_patterns = [
        r'\bein (niemals|immer|weil|obwohl)\b',  # Articles before adverbs/conjunctions
        r'\bDas (strategisch|umfassend|wesentlich|zeitgenössisch|entscheidend) (ist|muss|sollte|wird)\b',  # Adjectives as nouns
        r'\bsollte (strategisch|umfassend|wesentlich|zeitgenössisch) das\b',  # Adjectives as verbs
    ]

    for pattern in problematic_patterns:
        if re.search(pattern, sentence, re.IGNORECASE):
            return False, f"Invalid pattern found: {pattern}"

    # Check sentence length (should be 15-22 words for C1)
    word_count = len(sentence.split())
    if word_count < 15 or word_count > 22:
        return False, f"Word count {word_count} outside C1 range (15-22 words)"

    return True, ""

def generate_sentences_for_word(word, all_words, batch_num, total_batches):
    """Generate 3 C1-level German sentences for a given word using Claude."""

    prompt = f"""Generate 3 German C1-level sentences using the word "{word}".

**CRITICAL C1 Requirements:**

1. **Complexity (15-22 words):**
   - Use advanced grammar: Konjunktiv I/II, complex Nebensätze, Partizipialkonstruktionen
   - Professional/academic register
   - Sophisticated vocabulary

2. **Context:**
   - IT professional contexts
   - Business/administration scenarios
   - Technical discussions
   - Abstract concepts

3. **i+1 Principle:**
   - 80% bekannte Wörter, +1 fortgeschrittenes Konzept
   - Natural progression in difficulty

4. **AVOID THESE ERRORS:**
   - ❌ "Das strategisch ist" (adjective as noun)
   - ❌ "ein niemals" (article before adverb)
   - ❌ "sollte umfassend das" (adjective as verb)

5. **Good Examples:**
   - ✅ "Die Implementierung der neuen Infrastruktur erfordert eine umfassende Analyse der bestehenden Systeme."
   - ✅ "Hätten wir mehr Ressourcen gehabt, hätten wir das Projekt früher abschließen können."
   - ✅ "Der Architekt empfiehlt, dass wir die Datenbank grundlegend modernisieren."

**Available vocabulary** (use 2-3 of these in your sentences): {', '.join(all_words[:40])}

**Progress:** Batch {batch_num}/{total_batches}

Return ONLY a JSON array with 3 objects, each containing:
- "sentence": the complete German sentence (15-22 words, C1 grammar)
- "difficulty": "basic", "intermediate", or "advanced" (relative to C1)
- "vocabulary_used": array of advanced words used (including the target word)
- "domain": topic area (e.g., "it_infrastructure", "software_development", "professional")

Example format:
[
  {{
    "sentence": "Die Implementierung der cloudbasierten Infrastruktur erfordert eine umfassende Analyse der bestehenden Sicherheitsprotokolle und Datenschutzrichtlinien.",
    "difficulty": "basic",
    "vocabulary_used": ["Implementierung", "Infrastruktur", "Sicherheitsprotokolle", "Datenschutzrichtlinien"],
    "domain": "it_infrastructure"
  }},
  ...
]"""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=1500,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )

        # Extract JSON from response
        content = response.content[0].text
        # Find JSON array in response
        start_idx = content.find('[')
        end_idx = content.rfind(']') + 1
        if start_idx != -1 and end_idx > start_idx:
            json_str = content[start_idx:end_idx]
            sentences = json.loads(json_str)

            # Validate each sentence
            valid_sentences = []
            for sent in sentences:
                is_valid, error_msg = validate_german_sentence(sent["sentence"])
                if is_valid:
                    valid_sentences.append(sent)
                else:
                    print(f"    ⚠️  Validation failed: {error_msg}")
                    print(f"       Sentence: {sent['sentence']}")

            return valid_sentences if len(valid_sentences) == 3 else None
        else:
            raise ValueError("No JSON array found in response")

    except Exception as e:
        print(f"    ❌ Error generating sentences for '{word}': {e}")
        return None

def find_word_position(sentence, target_word):
    """Find the position (index) of the target word in the sentence."""
    words = sentence.split()
    target_lower = target_word.lower()
    # Also try without article
    target_without_article = target_word.split()[-1].lower() if ' ' in target_word else target_lower

    for i, word in enumerate(words):
        # Remove punctuation for comparison
        word_clean = word.strip('.,!?;:()[]{}«»"\'').lower()
        if word_clean == target_lower or word_clean == target_without_article or word_clean.startswith(target_without_article):
            return i

    # If not found, return -1
    return -1

def create_sentence_object(word, sentence_data, index, word_id):
    """Create a sentence object in the required format."""
    sentence = sentence_data["sentence"]
    target_index = find_word_position(sentence, word)

    # Create blank version
    words = sentence.split()
    if target_index >= 0 and target_index < len(words):
        blank_words = words.copy()
        blank_words[target_index] = "_____"
        blank = " ".join(blank_words)
    else:
        # Fallback: replace the word wherever it appears
        word_without_article = word.split()[-1] if ' ' in word else word
        blank = sentence.replace(word_without_article, "_____", 1)
        target_index = 0

    return {
        "id": f"de_{word_id}_{str(index).zfill(3)}",
        "full": sentence,
        "blank": blank,
        "target_word": word,
        "target_index": target_index,
        "vocabulary_used": sentence_data.get("vocabulary_used", [word]),
        "difficulty": sentence_data.get("difficulty", "intermediate"),
        "domain": sentence_data.get("domain", "professional")
    }

def run_validation_check(output_file):
    """Run validation grep check on generated sentences."""
    import subprocess

    patterns = [
        r"ein (niemals|immer|weil|obwohl)",
        r"Das (strategisch|umfassend|wesentlich|zeitgenössisch) (ist|muss|sollte)",
        r"sollte (strategisch|umfassend) das"
    ]

    print("\n" + "=" * 70)
    print("Running Validation Checks...")
    print("=" * 70)

    all_valid = True
    for pattern in patterns:
        try:
            result = subprocess.run(
                ['grep', '-E', pattern, str(output_file)],
                capture_output=True,
                text=True
            )
            if result.returncode == 0 and result.stdout.strip():
                print(f"❌ Found problematic pattern: {pattern}")
                print(f"   Matches: {len(result.stdout.strip().split(chr(10)))}")
                all_valid = False
            else:
                print(f"✅ Pattern check passed: {pattern}")
        except Exception as e:
            print(f"⚠️  Could not check pattern: {pattern} - {e}")

    return all_valid

def generate_all_sentences(kafel_data):
    """Generate sentences for all Kafel words."""

    # Extract all words
    kafel_words = [item["word"] for item in kafel_data]

    print(f"\nTotal words to process: {len(kafel_words)}")
    print(f"  - Kafel: {len(kafel_words)} words (IT professional focus)")
    print(f"  - Target: 540 sentences (3 per word)")
    print()

    sentences_data = {}
    total_processed = 0
    errors = []
    total_batches = len(kafel_words)

    # Process Kafel's words
    print("Processing Kafel's vocabulary...\n")
    for idx, word in enumerate(kafel_words, 1):
        print(f"  [{idx}/{total_batches}] Generating sentences for: {word}")
        sentence_list = generate_sentences_for_word(word, kafel_words, idx, total_batches)

        if sentence_list and len(sentence_list) == 3:
            word_id = normalize_word(word)
            sentences_data[word] = [
                create_sentence_object(word, sent, i+1, word_id)
                for i, sent in enumerate(sentence_list)
            ]
            total_processed += 1
            print(f"       ✓ Generated 3 sentences")
        else:
            error_msg = f"Failed to generate 3 valid sentences for: {word}"
            errors.append(error_msg)
            print(f"       ❌ {error_msg}")

        # Rate limiting
        time.sleep(0.5)

        # Validation checkpoint every 60 words
        if idx % 60 == 0:
            print(f"\n  📊 Checkpoint: {idx}/{total_batches} words processed")
            print(f"     Success rate: {(total_processed/idx)*100:.1f}%\n")

    print(f"\n{'=' * 70}")
    print(f"Processing Summary:")
    print(f"  Processed: {total_processed}/{len(kafel_words)} words")
    print(f"  Generated: {total_processed * 3} sentences")
    print(f"  Success rate: {(total_processed/len(kafel_words))*100:.1f}%")

    if errors:
        print(f"\n  Errors: {len(errors)}")
        for error in errors[:10]:  # Show first 10 errors
            print(f"    - {error}")
    print("=" * 70)

    return sentences_data, len(kafel_words)

def merge_with_existing(new_sentences_data, total_words):
    """Merge new Kafel sentences with existing de-c1-sentences.json."""

    existing_path = Path("public/data/sentences/de/de-c1-sentences.json")

    if not existing_path.exists():
        print("⚠️  Warning: Existing file not found. Creating new file instead.")
        return create_new_file(new_sentences_data, total_words)

    print(f"\nMerging with existing file: {existing_path}")

    # Load existing file
    with open(existing_path, 'r', encoding='utf-8') as f:
        existing_data = json.load(f)

    existing_count = len(existing_data["sentences"]) * 3
    print(f"  Existing sentences: {existing_count}")
    print(f"  New sentences: {len(new_sentences_data) * 3}")

    # Merge sentences
    merged_sentences = {**existing_data["sentences"], **new_sentences_data}

    # Update metadata
    merged_data = {
        "metadata": {
            "language": "de",
            "language_name": "German",
            "source_profiles": existing_data["metadata"]["source_profiles"] + ["kafel"],
            "source_level": "C1",
            "source_vocabulary": existing_data["metadata"]["source_vocabulary"] + ["public/data/kafel/de.json"],
            "total_words": existing_data["metadata"]["total_words"] + total_words,
            "total_sentences": len(merged_sentences) * 3,
            "generated_date": date.today().isoformat(),
            "version": "2.0",
            "generator": "Claude Code",
            "domains": existing_data["metadata"]["domains"] + ["it_infrastructure", "software_development"],
            "notes": f"Generated from Vahiko's urban planning vocabulary (180 words), Jawad's general C1 vocabulary (180 words), and Kafel's IT professional vocabulary (180 words). Contains professional, administrative, and technical contexts suitable for C1-level learners. Last updated: {date.today().isoformat()}"
        },
        "sentences": merged_sentences
    }

    print(f"  Merged total: {len(merged_sentences) * 3} sentences from {len(merged_sentences)} words")

    return merged_data

def create_new_file(sentences_data, total_words):
    """Create new file structure (fallback if no existing file)."""
    return {
        "metadata": {
            "language": "de",
            "language_name": "German",
            "source_profiles": ["kafel"],
            "source_level": "C1",
            "source_vocabulary": ["public/data/kafel/de.json"],
            "total_words": total_words,
            "total_sentences": len(sentences_data) * 3,
            "generated_date": date.today().isoformat(),
            "version": "1.0",
            "generator": "Claude Code",
            "domains": ["it_infrastructure", "software_development", "professional"],
            "notes": "Generated from Kafel's IT professional vocabulary (180 words). Contains technical and professional contexts suitable for C1-level learners."
        },
        "sentences": sentences_data
    }

def show_random_samples(output_data, num_samples=20):
    """Display random sample sentences from the generated data."""
    import random

    print("\n" + "=" * 70)
    print(f"Random Sample Sentences ({num_samples} samples)")
    print("=" * 70 + "\n")

    # Flatten all sentences
    all_sentences = []
    for word, sentences in output_data["sentences"].items():
        for sent in sentences:
            all_sentences.append(sent)

    # Get random samples
    samples = random.sample(all_sentences, min(num_samples, len(all_sentences)))

    for i, sent in enumerate(samples, 1):
        print(f"{i}. {sent['full']}")
        print(f"   Target: {sent['target_word']} | Difficulty: {sent['difficulty']} | Domain: {sent['domain']}")
        print(f"   Words: {len(sent['full'].split())} | Vocabulary: {', '.join(sent['vocabulary_used'][:3])}...")
        print()

def main():
    """Main execution function."""

    print("=" * 70)
    print("German C1 Sentence Generation - Kafel (IT Professional)")
    print("=" * 70)

    # Load vocabulary file
    kafel_path = Path("public/data/kafel/de.json")

    print("\nLoading vocabulary file...")
    kafel_data = load_vocabulary(kafel_path)
    print(f"✓ Loaded {len(kafel_data)} words from {kafel_path}")

    # Generate all sentences
    sentences_data, total_words = generate_all_sentences(kafel_data)

    if not sentences_data:
        print("\n❌ No sentences were generated. Exiting.")
        return

    # Merge with existing file
    output_data = merge_with_existing(sentences_data, total_words)

    # Save to output file
    output_dir = Path("public/data/sentences/de")
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "de-c1-sentences.json"

    print(f"\nSaving to: {output_path}")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    # Run validation checks
    validation_passed = run_validation_check(output_path)

    # Show random samples
    show_random_samples(output_data, num_samples=20)

    # Final summary
    print("=" * 70)
    print("✓ Generation Complete!")
    print("=" * 70)
    print(f"  New sentences generated: {len(sentences_data) * 3}")
    print(f"  Total sentences in file: {output_data['metadata']['total_sentences']}")
    print(f"  Total unique words: {output_data['metadata']['total_words']}")
    print(f"  Output file: {output_path}")
    print(f"  Validation: {'✅ PASSED' if validation_passed else '❌ FAILED'}")
    print("=" * 70)

if __name__ == "__main__":
    main()
