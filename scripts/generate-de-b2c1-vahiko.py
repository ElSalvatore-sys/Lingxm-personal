#!/usr/bin/env python3
"""
Generate 540 German B2-C1 sentences for Vahiko vocabulary.
Author: Claude Code
Date: 2025-11-05
"""

import json
import re
from datetime import datetime
from typing import List, Dict, Any
import random


def load_vocabulary(filepath: str) -> List[Dict[str, Any]]:
    """Load vocabulary from JSON file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def extract_word_with_article(word_entry: Dict[str, Any]) -> str:
    """Extract word with proper article."""
    word = word_entry.get('word', '')
    return word


def validate_german_grammar(sentence: str) -> bool:
    """
    Validate German sentence for common grammar mistakes.
    Returns True if valid, False if errors found.
    """
    # Check for adjectives used as standalone nouns (common mistake)
    # Pattern: "ist wichtig|komplex|strategisch" at end without proper context
    if re.search(r'\s+(wichtig|komplex|strategisch|umfassend|gründlich)\.$', sentence):
        # This could be valid in some contexts, need more sophisticated check
        pass

    # Check for articles with adverbs (should never happen)
    if re.search(r'\b(ein|eine|der|die|das)\s+(niemals|immer|oft|heute|gestern|morgen)\b', sentence):
        return False

    # Check for adjectives incorrectly used as subjects
    if re.search(r'\b(wichtig|komplex|strategisch)\s+(ist|wird|war)\b', sentence):
        # This might be "Das Wichtige ist..." which is valid, but "wichtig ist" alone is not
        if not re.search(r'\b(Das|Die|Der)\s+(Wichtige|Komplexe|Strategische)', sentence):
            return False

    return True


def generate_sentence_basic(word: str, word_data: Dict, index: int) -> Dict[str, Any]:
    """Generate a basic B2 sentence (Präsens/Perfekt, declarative)."""
    word_clean = word.replace('der ', '').replace('die ', '').replace('das ', '')

    # Get examples from word data if available
    examples = word_data.get('examples', {}).get('de', [])

    # Basic declarative sentences with professional context
    templates = [
        f"Der Stadtplaner hat den {word_clean} letzte Woche fertiggestellt.",
        f"In unserem Büro arbeiten wir täglich mit dem {word_clean}.",
        f"Die {word_clean} wurde von der Behörde genehmigt.",
        f"Vahiko prüft den {word_clean} sehr sorgfältig.",
        f"Der neue {word_clean} erfüllt alle rechtlichen Anforderungen.",
    ]

    sentence_de = random.choice(templates)

    # Find the position of the target word in the sentence
    target_index_pos = sentence_de.lower().find(word_clean.lower())
    words = sentence_de.split()
    target_idx = 0
    char_count = 0
    for i, w in enumerate(words):
        if char_count <= target_index_pos < char_count + len(w):
            target_idx = i
            break
        char_count += len(w) + 1  # +1 for space

    return {
        "id": f"de_b2c1_{word_clean.lower().replace(' ', '_')}_{str(index).zfill(3)}",
        "de": sentence_de,
        "en": f"Translation of: {sentence_de}",  # Placeholder
        "blank_de": sentence_de.replace(word_clean, '_____', 1),
        "target_word": word,
        "target_index": target_idx,
        "difficulty": "basic",
        "domain": "urban_planning"
    }


def generate_sentences_for_word(word: str, word_data: Dict, word_index: int) -> List[Dict[str, Any]]:
    """
    Generate 3 sentences for a single word (basic, intermediate, advanced).
    This is a simplified placeholder - the actual implementation would use
    Claude API or more sophisticated templates.
    """
    sentences = []

    word_clean = word.replace('der ', '').replace('die ', '').replace('das ', '')
    base_id = word_clean.lower().replace(' ', '_').replace('ä', 'ae').replace('ö', 'oe').replace('ü', 'ue').replace('ß', 'ss')

    # Sentence 1: Basic (12-14 words, Präsens/Perfekt)
    sentences.append({
        "id": f"de_b2c1_{base_id}_001",
        "de": f"PLACEHOLDER_BASIC_{word_index}",
        "en": "PLACEHOLDER_EN",
        "blank_de": f"PLACEHOLDER_BLANK",
        "target_word": word,
        "target_index": 0,
        "difficulty": "basic",
        "domain": "urban_planning"
    })

    # Sentence 2: Intermediate (14-16 words, Konjunktiv II or Passiv)
    sentences.append({
        "id": f"de_b2c1_{base_id}_002",
        "de": f"PLACEHOLDER_INTERMEDIATE_{word_index}",
        "en": "PLACEHOLDER_EN",
        "blank_de": f"PLACEHOLDER_BLANK",
        "target_word": word,
        "target_index": 0,
        "difficulty": "intermediate",
        "domain": "urban_planning"
    })

    # Sentence 3: Advanced (16-18 words, complex Nebensätze)
    sentences.append({
        "id": f"de_b2c1_{base_id}_003",
        "de": f"PLACEHOLDER_ADVANCED_{word_index}",
        "en": "PLACEHOLDER_EN",
        "blank_de": f"PLACEHOLDER_BLANK",
        "target_word": word,
        "target_index": 0,
        "difficulty": "advanced",
        "domain": "urban_planning"
    })

    return sentences


def create_output_structure(vocab_filepath: str, sentences_by_word: Dict[str, List[Dict]]) -> Dict[str, Any]:
    """Create the final JSON output structure."""
    total_sentences = sum(len(sents) for sents in sentences_by_word.values())

    output = {
        "metadata": {
            "language": "de",
            "language_name": "German",
            "source_profile": "vahiko",
            "source_level": "B2-C1",
            "source_vocabulary": vocab_filepath,
            "total_words": len(sentences_by_word),
            "total_sentences": total_sentences,
            "generated_date": datetime.now().strftime("%Y-%m-%d"),
            "version": "2.0",
            "generator": "Claude Code",
            "domain": "urban_planning",
            "translations": ["en"],
            "notes": "B2-C1 level sentences for urban planning professional (Vahiko). Features Konjunktiv II, Passiv constructions, and complex syntax appropriate for professional contexts."
        },
        "sentences": sentences_by_word
    }

    return output


def main():
    """Main execution function."""
    print("🚀 Starting German B2-C1 sentence generation for Vahiko...")

    # Paths
    vocab_path = "/Users/eldiaploo/Desktop/LingXM-Personal/public/data/vahiko/de.json"
    output_path = "/Users/eldiaploo/Desktop/LingXM-Personal/public/data/sentences/de/de-b2c1-sentences.json"

    # Load vocabulary
    print(f"📖 Loading vocabulary from: {vocab_path}")
    vocabulary = load_vocabulary(vocab_path)
    print(f"✅ Loaded {len(vocabulary)} words")

    if len(vocabulary) != 180:
        print(f"⚠️  WARNING: Expected 180 words, found {len(vocabulary)}")

    # This script creates a PLACEHOLDER structure
    # The actual sentence generation should be done with Claude API
    # or by manually crafting sentences

    print("\n⚠️  NOTE: This script creates placeholders.")
    print("📝 Actual sentence generation requires LLM assistance.")
    print("\nTo proceed with generation, we need to:")
    print("1. Use Claude API to generate quality sentences")
    print("2. Or manually craft sentences following B2-C1 guidelines")
    print("\nPlease use the Claude API integration or manual generation approach.")

    return vocabulary


if __name__ == "__main__":
    vocab = main()
    print(f"\n📊 Total words to process: {len(vocab)}")
    print(f"📊 Total sentences needed: {len(vocab) * 3} = 540")
