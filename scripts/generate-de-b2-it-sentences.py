#!/usr/bin/env python3
"""
Generate B2-level German IT sentences from Kafel vocabulary.
Uses Anthropic Claude API to generate high-quality, technically accurate sentences.
"""

import json
import os
import re
from pathlib import Path
from anthropic import Anthropic
from datetime import date
import time
import random

# Initialize Anthropic client
client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

def load_vocabulary(file_path):
    """Load vocabulary from JSON file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def normalize_word(word):
    """Normalize word for ID generation (remove articles, spaces, lowercase)."""
    # Remove articles
    word_clean = re.sub(r'^(der|die|das)\s+', '', word, flags=re.IGNORECASE)
    # Normalize special characters
    word_clean = word_clean.lower().replace(' ', '_').replace('ä', 'ae').replace('ö', 'oe').replace('ü', 'ue').replace('ß', 'ss')
    return word_clean

def validate_sentence_quality(sentence, target_word):
    """Validate sentence doesn't have adjective-as-noun errors."""
    # Common IT adjectives that should NOT be used as nouns
    bad_patterns = [
        r'\bein\s+(skalierbar|robust|effizient|stabil|sicher|flexibel|performant)\b',
        r'\bder\s+(skalierbar|robust|effizient|stabil|sicher|flexibel|performant)\b',
        r'\bdie\s+(skalierbar|robust|effizient|stabil|sicher|flexibel|performant)\b',
        r'\bdas\s+(skalierbar|robust|effizient|stabil|sicher|flexibel|performant)\b',
        r'\bimplementiere\s+(skalierbar|robust|effizient)\s*$',
        r'\b(skalierbar|robust|effizient|stabil|sicher|flexibel)\s+ist\s+(wichtig|notwendig)\s*\.',
    ]

    for pattern in bad_patterns:
        if re.search(pattern, sentence, re.IGNORECASE):
            return False, f"Adjective-as-noun error detected: {pattern}"

    # Check word count (12-18 words for B2)
    word_count = len(sentence.split())
    if word_count < 10 or word_count > 20:
        return False, f"Word count out of range: {word_count} (expected 12-18)"

    return True, "OK"

def generate_sentences_for_word(word, word_obj, all_words, batch_num=0):
    """Generate 3 B2-level German IT sentences for a given word using Claude."""

    # Get context from word object
    explanation_de = word_obj.get("explanation", {}).get("de", "")
    examples = word_obj.get("examples", {}).get("de", [])

    prompt = f"""Generate 3 German B2-level IT sentences using the word "{word}".

CRITICAL QUALITY REQUIREMENTS:
❌ NEVER use adjectives as nouns! Examples of what NOT to do:
   - "ein skalierbar ist wichtig" ❌
   - "Der effizient muss sein" ❌
   - "implementiere das robust" ❌

✅ CORRECT usage of adjectives:
   - "ein skalierbares System" ✓
   - "Die effiziente Lösung" ✓
   - "implementiere es robust" ✓

REQUIREMENTS:
- B2 level: Professional IT register, technical vocabulary
- 12-18 words per sentence
- IT context: Software development, databases, networks, infrastructure, DevOps, testing
- i+1 principle: 85% known vocabulary + 1 new IT term (the target word)
- Each sentence must demonstrate different IT contexts:
  1. Development/implementation context
  2. System/architecture context
  3. Practical application/operations context
- Natural German word order
- Technically accurate and realistic scenarios

Word explanation: {explanation_de}
Example usage: {examples[0] if examples else 'N/A'}

Available IT vocabulary pool (use 1-2 of these): {', '.join(random.sample(all_words[:50], min(15, len(all_words))))}

Return ONLY a JSON array with 3 objects, each containing:
- "sentence": the complete German sentence (12-18 words)
- "translation": English translation
- "difficulty": "basic", "intermediate", or "advanced" (relative to B2)
- "vocabulary_used": array of IT words used (including the target word)

Example format:
[
  {{
    "sentence": "Der Entwickler optimiert die Datenbank, um die Performance der Webanwendung zu verbessern.",
    "translation": "The developer optimizes the database to improve the performance of the web application.",
    "difficulty": "basic",
    "vocabulary_used": ["der Entwickler", "die Datenbank", "die Performance", "die Webanwendung"]
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
            sentences = json.loads(json_str)

            # Validate each sentence
            validated_sentences = []
            for sent in sentences:
                is_valid, msg = validate_sentence_quality(sent["sentence"], word)
                if is_valid:
                    validated_sentences.append(sent)
                else:
                    print(f"    ⚠️  Quality issue: {msg}")
                    return None  # Regenerate if any sentence fails

            return validated_sentences if len(validated_sentences) == 3 else None
        else:
            raise ValueError("No JSON array found in response")

    except Exception as e:
        print(f"    ❌ Error: {e}")
        return None

def find_word_position(sentence, target_word):
    """Find the position (index) of the target word in the sentence."""
    words = sentence.split()

    # Try exact match first (with article)
    target_lower = target_word.lower()
    for i, word in enumerate(words):
        word_clean = word.strip('.,!?;:()[]{}«»"\'').lower()
        if word_clean == target_lower:
            return i

    # Try without article
    target_no_article = re.sub(r'^(der|die|das)\s+', '', target_word, flags=re.IGNORECASE).lower()
    for i, word in enumerate(words):
        word_clean = word.strip('.,!?;:()[]{}«»"\'').lower()
        if word_clean == target_no_article or word_clean.startswith(target_no_article):
            return i

    return 0  # Fallback

def create_sentence_object(word, sentence_data, index, word_id):
    """Create a sentence object in the required format."""
    sentence = sentence_data["sentence"]
    translation = sentence_data.get("translation", "")
    target_index = find_word_position(sentence, word)

    # Create blank version
    words = sentence.split()
    if target_index >= 0 and target_index < len(words):
        blank_words = words.copy()
        blank_words[target_index] = "_____"
        blank = " ".join(blank_words)
    else:
        # Fallback: replace the word wherever it appears (without article)
        word_no_article = re.sub(r'^(der|die|das)\s+', '', word, flags=re.IGNORECASE)
        blank = sentence.replace(word_no_article, "_____", 1)
        target_index = 0

    return {
        "id": f"de_b2_it_{word_id}_{str(index).zfill(3)}",
        "full": sentence,
        "translation": translation,
        "blank": blank,
        "target_word": word,
        "target_index": target_index,
        "vocabulary_used": sentence_data.get("vocabulary_used", [word]),
        "difficulty": sentence_data.get("difficulty", "intermediate"),
        "domain": "it"
    }

def run_quality_check(sentences_data):
    """Run quality checks on all generated sentences."""
    print("\n🔍 Running quality checks...")

    # Collect all sentences
    all_sentences = []
    for word, sentences in sentences_data.items():
        for sent in sentences:
            all_sentences.append(sent["full"])

    # Check for adjective-as-noun errors
    error_count = 0
    error_patterns = [
        r'\bein\s+(skalierbar|robust|effizient|stabil|sicher|flexibel|performant)\b',
        r'\b(skalierbar|robust|effizient|stabil|sicher|flexibel|performant)\s+ist\b',
        r'\bimplementiere\s+(skalierbar|robust|effizient)\s*$',
    ]

    for pattern in error_patterns:
        for sentence in all_sentences:
            if re.search(pattern, sentence, re.IGNORECASE):
                error_count += 1
                print(f"  ❌ Found error: {sentence[:80]}...")

    # Check word count distribution
    word_counts = [len(s.split()) for s in all_sentences]
    avg_words = sum(word_counts) / len(word_counts)

    print(f"\n📊 Quality Report:")
    print(f"  Total sentences: {len(all_sentences)}")
    print(f"  Adjective-as-noun errors: {error_count}")
    print(f"  Average words per sentence: {avg_words:.1f}")
    print(f"  Word count range: {min(word_counts)}-{max(word_counts)}")

    if error_count == 0:
        print(f"  ✅ All sentences passed quality checks!")
    else:
        print(f"  ⚠️  Found {error_count} quality issues")

    return error_count == 0

def generate_all_sentences(kafel_data):
    """Generate sentences for all words from Kafel IT vocabulary."""

    # Extract all words
    all_words = [item["word"] for item in kafel_data]

    print(f"\n📚 Total words to process: {len(all_words)}")
    print(f"   Context: IT/Software Development (Kafel)")
    print(f"   Target: 540 sentences (3 per word)\n")

    sentences_data = {}
    total_processed = 0
    errors = []
    batch_size = 60

    for idx, word_obj in enumerate(kafel_data, 1):
        word = word_obj["word"]
        print(f"[{idx}/{len(all_words)}] {word}...", end=" ")

        # Try up to 2 times if quality validation fails
        sentence_list = None
        for attempt in range(2):
            sentence_list = generate_sentences_for_word(word, word_obj, all_words, idx)
            if sentence_list and len(sentence_list) == 3:
                break
            if attempt == 0:
                print(f"retry...", end=" ")

        if sentence_list and len(sentence_list) == 3:
            word_id = normalize_word(word)
            sentences_data[word] = [
                create_sentence_object(word, sent, i+1, word_id)
                for i, sent in enumerate(sentence_list)
            ]
            total_processed += 1
            print(f"✓")
        else:
            errors.append(f"Failed to generate sentences for: {word}")
            print(f"❌")

        # Rate limiting
        time.sleep(0.5)

        # Quality check every 60 words
        if idx % batch_size == 0:
            print(f"\n{'='*70}")
            print(f"📊 Batch {idx//batch_size} Complete ({idx} words processed)")
            run_quality_check(sentences_data)
            print(f"{'='*70}\n")

    print(f"\n✓ Processed: {total_processed}/{len(all_words)} words")
    if errors:
        print(f"⚠️  Errors: {len(errors)}")
        for error in errors[:10]:
            print(f"  - {error}")

    return sentences_data, len(all_words)

def main():
    """Main execution function."""

    print("=" * 70)
    print("🇩🇪 German B2 IT Sentence Generation (Kafel)")
    print("=" * 70)

    # Load vocabulary file
    kafel_path = Path("public/data/kafel/de-it.json")

    print("\n📂 Loading vocabulary file...")
    print(f"   {kafel_path}")
    kafel_data = load_vocabulary(kafel_path)

    # Generate all sentences
    sentences_data, total_words = generate_all_sentences(kafel_data)

    # Final quality check
    print("\n" + "=" * 70)
    print("🔍 Final Quality Validation")
    print("=" * 70)
    quality_pass = run_quality_check(sentences_data)

    # Create output structure with metadata
    output = {
        "metadata": {
            "language": "de",
            "language_name": "German",
            "level": "B2",
            "specialization": "IT",
            "source_profile": "kafel",
            "source_vocabulary": "public/data/kafel/de-it.json",
            "total_words": total_words,
            "total_sentences": len(sentences_data) * 3,
            "generated_date": date.today().isoformat(),
            "version": "1.0",
            "generator": "Claude Code",
            "domain": "it",
            "quality_validated": quality_pass,
            "notes": "Generated from Kafel's IT vocabulary (180 words). Contains software development, databases, networks, infrastructure, and DevOps contexts suitable for B2-level IT professionals."
        },
        "sentences": sentences_data
    }

    # Save to output file
    output_dir = Path("public/data/sentences/de-specialized")
    output_dir.mkdir(parents=True, exist_ok=True)

    output_path = output_dir / "de-b2-it-sentences.json"

    print(f"\n💾 Saving to: {output_path}")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    # Show random examples
    print("\n" + "=" * 70)
    print("📝 20 Random Technical Examples")
    print("=" * 70)

    all_sentences = []
    for word, sents in sentences_data.items():
        for sent in sents:
            all_sentences.append((word, sent))

    random_samples = random.sample(all_sentences, min(20, len(all_sentences)))
    for i, (word, sent) in enumerate(random_samples, 1):
        print(f"\n{i}. [{word}]")
        print(f"   DE: {sent['full']}")
        print(f"   EN: {sent['translation']}")

    print("\n" + "=" * 70)
    print("✅ Generation Complete!")
    print(f"   Total words: {total_words}")
    print(f"   Total sentences: {len(sentences_data) * 3}")
    print(f"   Quality validated: {'✓' if quality_pass else '✗'}")
    print(f"   Output file: {output_path}")
    print("=" * 70)

if __name__ == "__main__":
    main()
