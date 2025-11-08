#!/usr/bin/env python3
"""
Combine all batch-generated sentences into final output file.
"""

import json
from pathlib import Path
from datetime import date

def normalize_word(word):
    """Normalize word for ID generation."""
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
    target_clean = target_word.replace('die ', '').replace('der ', '').replace('das ', '').lower()

    for i, word in enumerate(words):
        word_clean = word.strip('.,!?;:()[]{}«»"\'').lower()
        if target_clean in word_clean or word_clean in target_clean:
            return i
    return 0

def create_sentence_entry(word, sentence_data, index):
    """Create a properly formatted sentence entry."""
    word_id = normalize_word(word)
    sentence = sentence_data["sentence"]
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
        "vocabulary_used": sentence_data.get("vocabulary_used", [word]),
        "difficulty": sentence_data.get("difficulty", "intermediate"),
        "domain": sentence_data.get("domain", "general")
    }

def load_batch_file(filepath):
    """Load a batch file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Warning: {filepath} not found")
        return {}

def main():
    print("=" * 70)
    print("Combining All Generated Sentences")
    print("=" * 70)

    # Load all batch files
    vahiko_1_3 = load_batch_file('/tmp/vahiko_batch_1-3.json')
    vahiko_4_6 = load_batch_file('/tmp/vahiko_batch_4-6.json')
    jawad_1_3 = load_batch_file('/tmp/jawad_batch_1-3.json')
    jawad_4 = load_batch_file('/tmp/jawad_batch_4.json')
    jawad_5 = load_batch_file('/tmp/jawad_batch_5.json')
    jawad_6 = load_batch_file('/tmp/jawad_batch_6.json')

    # Combine all
    all_sentences = {}
    all_sentences.update(vahiko_1_3)
    all_sentences.update(vahiko_4_6)
    all_sentences.update(jawad_1_3)
    all_sentences.update(jawad_4)
    all_sentences.update(jawad_5)
    all_sentences.update(jawad_6)

    print(f"\nTotal words collected: {len(all_sentences)}")

    # Convert to final format
    sentences_data = {}
    skipped = []

    for word, sentences in all_sentences.items():
        try:
            if not isinstance(sentences, list):
                skipped.append(f"{word}: not a list")
                continue

            word_sentences = []
            for i, sent in enumerate(sentences):
                if not isinstance(sent, dict) or "sentence" not in sent:
                    skipped.append(f"{word}: sentence {i+1} malformed - {sent}")
                    continue
                word_sentences.append(create_sentence_entry(word, sent, i + 1))

            if word_sentences:
                sentences_data[word] = word_sentences
        except Exception as e:
            skipped.append(f"{word}: error - {e}")

    if skipped:
        print(f"\nSkipped {len(skipped)} entries:")
        for skip in skipped[:10]:  # Show first 10
            print(f"  - {skip}")

    total_sentences = sum(len(sents) for sents in sentences_data.values())

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
            "total_words": len(sentences_data),
            "total_sentences": total_sentences,
            "generated_date": date.today().isoformat(),
            "version": "1.0",
            "generator": "Claude Code",
            "domains": ["urban_planning", "administration", "governance", "academic", "philosophical"],
            "notes": f"Generated from Vahiko's urban planning vocabulary and Jawad's general C1 vocabulary. Contains {len(sentences_data)} unique words with professional and academic contexts suitable for C1-level learners."
        },
        "sentences": sentences_data
    }

    # Save output
    output_dir = Path("public/data/sentences/de")
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "de-c1-sentences.json"

    print(f"\nSaving to: {output_path}")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 70)
    print("✓ Generation complete!")
    print(f"  Total words: {len(sentences_data)}")
    print(f"  Total sentences: {total_sentences}")
    print(f"  Output file: {output_path}")
    print("=" * 70)

if __name__ == "__main__":
    main()
