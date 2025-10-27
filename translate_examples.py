#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to translate German example sentences to Polish in de.json vocabulary file.
Uses Claude API for high-quality translations of urban planning terminology.
"""

import json
import os
from anthropic import Anthropic

# Initialize Anthropic client
client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

def translate_examples_batch(words_batch):
    """
    Translate a batch of German examples to Polish using Claude.
    """
    # Prepare the translation request
    prompt_parts = []
    prompt_parts.append("You are a professional translator specializing in urban planning and city administration terminology. Translate the following German example sentences to Polish. Provide natural, professional C1-level translations that maintain the meaning and context of the originals.\n\n")

    for idx, word_data in enumerate(words_batch):
        word = word_data['word']
        de_examples = word_data['examples']['de']
        prompt_parts.append(f"Word {idx + 1}: {word}\n")
        for i, example in enumerate(de_examples, 1):
            prompt_parts.append(f"  DE{i}: {example}\n")
        prompt_parts.append("\n")

    prompt_parts.append("Respond ONLY with a JSON array containing the Polish translations. Format:\n")
    prompt_parts.append('[\n  {"word": "WordName", "pl_examples": ["Polish sentence 1", "Polish sentence 2"]},\n  ...\n]\n')
    prompt_parts.append("\nEnsure proper Polish characters (ą, ę, ć, ń, ó, ś, ź, ż) and professional terminology.")

    prompt = "".join(prompt_parts)

    # Call Claude API
    message = client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=8000,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    # Parse response
    response_text = message.content[0].text

    # Extract JSON from response (handle potential markdown code blocks)
    if "```json" in response_text:
        json_start = response_text.find("```json") + 7
        json_end = response_text.find("```", json_start)
        response_text = response_text[json_start:json_end].strip()
    elif "```" in response_text:
        json_start = response_text.find("```") + 3
        json_end = response_text.find("```", json_start)
        response_text = response_text[json_start:json_end].strip()

    translations = json.loads(response_text)
    return translations

def main():
    input_file = "/Users/eldiaploo/Desktop/LingXM-Personal/data/vahiko/de.json"
    output_file = "/Users/eldiaploo/Desktop/LingXM-Personal/data/vahiko/de.json"

    print("Loading vocabulary file...")
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"Found {len(data)} vocabulary words")

    # Process in batches of 10 to avoid API token limits
    batch_size = 10
    total_words = len(data)
    updated_count = 0

    for i in range(0, total_words, batch_size):
        batch = data[i:i+batch_size]
        batch_num = i // batch_size + 1
        total_batches = (total_words + batch_size - 1) // batch_size

        print(f"\nProcessing batch {batch_num}/{total_batches} (words {i+1}-{min(i+batch_size, total_words)})...")

        try:
            translations = translate_examples_batch(batch)

            # Update the original data with translations
            for j, translation in enumerate(translations):
                word_index = i + j
                word_name = translation['word']
                pl_examples = translation['pl_examples']

                # Verify we're updating the correct word
                if data[word_index]['word'] == word_name:
                    data[word_index]['examples']['pl'] = pl_examples
                    updated_count += 1
                    print(f"  ✓ Updated: {word_name}")
                else:
                    print(f"  ⚠ Warning: Word mismatch at index {word_index}")

        except Exception as e:
            print(f"  ✗ Error processing batch {batch_num}: {e}")
            continue

    # Save the updated data
    print(f"\nSaving updated file with {updated_count} words...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\n✓ Successfully updated {updated_count} words!")
    print(f"✓ File saved to: {output_file}")

if __name__ == "__main__":
    main()
