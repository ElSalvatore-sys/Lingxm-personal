#!/usr/bin/env python3
"""
Generate C1-level German sentences - Direct generation approach.
This script creates a template that will be filled with Claude-generated sentences.
"""

import json
from pathlib import Path
from datetime import date

def normalize_word(word):
    """Normalize word for ID generation."""
    # Remove articles and spaces, convert umlauts
    word_clean = word.replace('die ', '').replace('der ', '').replace('das ', '')
    return (word_clean.lower()
            .replace(' ', '_')
            .replace('ä', 'ae')
            .replace('ö', 'oe')
            .replace('ü', 'ue')
            .replace('ß', 'ss')
            .replace('-', '_'))

def find_word_position(sentence, target_word):
    """Find the position of target word in sentence."""
    words = sentence.split()
    # Clean target word of articles
    target_clean = target_word.replace('die ', '').replace('der ', '').replace('das ', '').lower()

    for i, word in enumerate(words):
        word_clean = word.strip('.,!?;:()[]{}«»"\'').lower()
        if target_clean in word_clean or word_clean in target_clean:
            return i
    return 0

def create_sentence_entry(word, sentence, index, vocabulary_used, difficulty, domain):
    """Create a properly formatted sentence entry."""
    word_id = normalize_word(word)
    target_index = find_word_position(sentence, word)

    # Create blank version
    words = sentence.split()
    if 0 <= target_index < len(words):
        blank_words = words.copy()
        blank_words[target_index] = "_____"
        blank = " ".join(blank_words)
    else:
        blank = sentence.replace(word, "_____", 1)

    return {
        "id": f"de_{word_id}_{str(index).zfill(3)}",
        "full": sentence,
        "blank": blank,
        "target_word": word,
        "target_index": target_index,
        "vocabulary_used": vocabulary_used,
        "difficulty": difficulty,
        "domain": domain
    }

def load_words():
    """Load words from temporary files."""
    with open('/tmp/vahiko_words.json', 'r', encoding='utf-8') as f:
        vahiko = json.load(f)
    with open('/tmp/jawad_words.json', 'r', encoding='utf-8') as f:
        jawad = json.load(f)
    return vahiko, jawad

def main():
    # This script will be run after sentences are generated
    # It creates the final JSON structure

    vahiko_words, jawad_words = load_words()

    # Load generated sentences
    with open('/tmp/generated_sentences.json', 'r', encoding='utf-8') as f:
        generated = json.load(f)

    # Build final structure
    sentences_data = {}

    for word, sentences in generated.items():
        sentences_data[word] = [
            create_sentence_entry(
                word,
                sent["sentence"],
                i + 1,
                sent.get("vocabulary_used", [word]),
                sent.get("difficulty", "intermediate"),
                sent.get("domain", "administration")
            )
            for i, sent in enumerate(sentences)
        ]

    # Remove duplicates from vahiko (there seem to be some)
    unique_vahiko = []
    seen = set()
    for w in vahiko_words:
        if w not in seen:
            unique_vahiko.append(w)
            seen.add(w)

    unique_jawad = []
    seen = set()
    for w in jawad_words:
        if w not in seen:
            unique_jawad.append(w)
            seen.add(w)

    total_words = len(unique_vahiko) + len(unique_jawad)

    # Create output with metadata
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
            "domains": ["urban_planning", "administration", "governance", "academic"],
            "notes": f"Generated from Vahiko's urban planning vocabulary ({len(unique_vahiko)} words) and Jawad's general C1 vocabulary ({len(unique_jawad)} words). Contains professional and administrative contexts suitable for C1-level learners."
        },
        "sentences": sentences_data
    }

    # Save output
    output_dir = Path("public/data/sentences/de")
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "de-c1-sentences.json"

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"✓ Saved {len(sentences_data)} words with {len(sentences_data) * 3} sentences to {output_path}")

if __name__ == "__main__":
    main()
