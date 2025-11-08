#!/usr/bin/env python3
"""
Generate C1-level German sentences from vocabulary files.
Uses Anthropic Claude API to generate high-quality, contextually appropriate sentences.
"""

import json
import os
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

def generate_sentences_for_word(word, all_words, domain="general"):
    """Generate 3 C1-level German sentences for a given word using Claude."""

    prompt = f"""Generate 3 German C1-level sentences using the word "{word}".

Requirements:
- C1 level: Academic style, formal registers, abstractions
- Topics: administration, governance, professional discourse
- Each sentence should be 12-18 words long
- Use a mix of other C1-level vocabulary where appropriate
- Each sentence should demonstrate different contexts/uses of the word
- Maintain grammatical accuracy and natural German expression

Available vocabulary pool (use some of these in your sentences): {', '.join(all_words[:30])}

Return ONLY a JSON array with 3 objects, each containing:
- "sentence": the complete German sentence
- "difficulty": "basic", "intermediate", or "advanced" (relative to C1)
- "vocabulary_used": array of advanced words used (including the target word)

Example format:
[
  {{
    "sentence": "Die Stadtplanung muss den Bebauungsplan sorgfältig überarbeiten.",
    "difficulty": "basic",
    "vocabulary_used": ["Bebauungsplan", "Stadtplanung", "überarbeiten"]
  }},
  ...
]"""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=1024,
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
            return json.loads(json_str)
        else:
            raise ValueError("No JSON array found in response")

    except Exception as e:
        print(f"Error generating sentences for '{word}': {e}")
        return None

def find_word_position(sentence, target_word):
    """Find the position (index) of the target word in the sentence."""
    words = sentence.split()
    target_lower = target_word.lower()

    for i, word in enumerate(words):
        # Remove punctuation for comparison
        word_clean = word.strip('.,!?;:()[]{}«»"\'').lower()
        if word_clean == target_lower or word_clean.startswith(target_lower):
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
        blank = sentence.replace(word, "_____", 1)
        target_index = 0

    return {
        "id": f"de_{word_id}_{str(index).zfill(3)}",
        "full": sentence,
        "blank": blank,
        "target_word": word,
        "target_index": target_index,
        "vocabulary_used": sentence_data.get("vocabulary_used", [word]),
        "difficulty": sentence_data.get("difficulty", "intermediate"),
        "domain": "administration"
    }

def generate_all_sentences(vahiko_data, jawad_data):
    """Generate sentences for all words from both sources."""

    # Extract all words
    vahiko_words = [item["word"] for item in vahiko_data]
    jawad_words = [item["word"] for item in jawad_data]
    all_words = vahiko_words + jawad_words

    print(f"Total words to process: {len(all_words)}")
    print(f"  - Vahiko: {len(vahiko_words)} words (urban planning focus)")
    print(f"  - Jawad: {len(jawad_words)} words (general C1)")

    sentences_data = {}
    total_processed = 0
    errors = []

    # Process Vahiko's words (urban planning)
    print("\nProcessing Vahiko's vocabulary...")
    for word in vahiko_words:
        print(f"  Generating sentences for: {word}")
        sentence_list = generate_sentences_for_word(word, all_words, domain="urban_planning")

        if sentence_list and len(sentence_list) == 3:
            word_id = normalize_word(word)
            sentences_data[word] = [
                create_sentence_object(word, sent, i+1, word_id)
                for i, sent in enumerate(sentence_list)
            ]
            total_processed += 1
        else:
            errors.append(f"Failed to generate sentences for: {word}")

        # Rate limiting
        time.sleep(0.5)

    # Process Jawad's words (general C1)
    print("\nProcessing Jawad's vocabulary...")
    for word in jawad_words:
        print(f"  Generating sentences for: {word}")
        sentence_list = generate_sentences_for_word(word, all_words, domain="general")

        if sentence_list and len(sentence_list) == 3:
            word_id = normalize_word(word)
            sentences_data[word] = [
                create_sentence_object(word, sent, i+1, word_id)
                for i, sent in enumerate(sentence_list)
            ]
            total_processed += 1
        else:
            errors.append(f"Failed to generate sentences for: {word}")

        # Rate limiting
        time.sleep(0.5)

    print(f"\nProcessed: {total_processed}/{len(all_words)} words")
    if errors:
        print(f"Errors: {len(errors)}")
        for error in errors[:10]:  # Show first 10 errors
            print(f"  - {error}")

    return sentences_data, len(all_words)

def main():
    """Main execution function."""

    print("=" * 70)
    print("German C1 Sentence Generation")
    print("=" * 70)

    # Load vocabulary files
    vahiko_path = Path("public/data/vahiko/de.json")
    jawad_path = Path("public/data/jawad/de.json")

    print("\nLoading vocabulary files...")
    vahiko_data = load_vocabulary(vahiko_path)
    jawad_data = load_vocabulary(jawad_path)

    # Generate all sentences
    sentences_data, total_words = generate_all_sentences(vahiko_data, jawad_data)

    # Create output structure with metadata
    output = {
        "metadata": {
            "language": "de",
            "language_name": "German",
            "source_profiles": ["vahiko", "jawad"],
            "source_level": "C1",
            "source_vocabulary": [
                "public/data/vahiko/de.json",
                "public/data/jawad/de.json"
            ],
            "total_words": total_words,
            "total_sentences": len(sentences_data) * 3,
            "generated_date": date.today().isoformat(),
            "version": "1.0",
            "generator": "Claude Code",
            "domains": ["urban_planning", "administration", "governance"],
            "notes": "Generated from Vahiko's urban planning vocabulary (180 words) and Jawad's general C1 vocabulary (180 words). Contains professional and administrative contexts suitable for C1-level learners."
        },
        "sentences": sentences_data
    }

    # Save to output file
    output_dir = Path("public/data/sentences/de")
    output_dir.mkdir(parents=True, exist_ok=True)

    output_path = output_dir / "de-c1-sentences.json"

    print(f"\nSaving to: {output_path}")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 70)
    print("✓ Generation complete!")
    print(f"  Total words: {total_words}")
    print(f"  Total sentences: {len(sentences_data) * 3}")
    print(f"  Output file: {output_path}")
    print("=" * 70)

if __name__ == "__main__":
    main()
