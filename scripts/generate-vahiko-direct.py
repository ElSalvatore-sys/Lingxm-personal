#!/usr/bin/env python3
"""
Direct generation wrapper - sentences will be provided by Claude Code
This script validates and formats the sentences
"""

import json
import re
import os
from typing import List, Dict

def validate_grammar(sentence: str) -> tuple[bool, str]:
    """Validate German grammar to catch common errors"""

    # Check for article + adverb errors
    adverbs = r'\b(niemals|immer|oft|selten|manchmal|gestern|heute|morgen|jetzt|bald|früher|später)\b'
    if re.search(rf'\b(ein|eine|der|die|das)\s+{adverbs}', sentence, re.IGNORECASE):
        return False, f"Article with adverb error: {sentence}"

    # Check for adjective as noun errors
    adjectives = r'\b(wichtig|komplex|strategisch|umfassend|gründlich|effektiv|nachhaltig|innovativ)\b'
    if re.search(rf'(ist|war|wird|denke|finde)\s+{adjectives}\s+(ist|war|wird|\.)', sentence, re.IGNORECASE):
        return False, f"Adjective as noun error: {sentence}"

    return True, ""

def validate_and_save(sentences: List[Dict], output_file: str):
    """Validate sentences and save to file"""

    print(f"\n{'='*60}")
    print("VALIDATING SENTENCES")
    print(f"{'='*60}")

    valid_sentences = []
    errors = []

    for sent in sentences:
        is_valid, error = validate_grammar(sent["sentence"])
        if is_valid:
            valid_sentences.append(sent)
        else:
            errors.append(error)
            print(f"❌ {error}")

    if errors:
        print(f"\n⚠️  Found {len(errors)} grammar errors!")
        return False

    print(f"✅ All {len(valid_sentences)} sentences passed validation!")

    # Calculate statistics
    word_lengths = [len(s["sentence"].split()) for s in valid_sentences]
    avg_length = sum(word_lengths) / len(word_lengths)

    print(f"\n{'='*60}")
    print("STATISTICS")
    print(f"{'='*60}")
    print(f"📊 Total sentences: {len(valid_sentences)}")
    print(f"📊 Average length: {avg_length:.1f} words")
    print(f"📊 Min length: {min(word_lengths)} words")
    print(f"📊 Max length: {max(word_lengths)} words")

    # Save to file
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(valid_sentences, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Saved to: {output_file}")
    return True

if __name__ == "__main__":
    # This will be called after Claude Code generates the sentences
    print("Ready to validate and save sentences...")
