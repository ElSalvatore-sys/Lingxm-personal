#!/usr/bin/env python3
"""
Direct translation script for Vahiko to Ameeno transformation
Processes translations using simple prompts without API
"""

import json
import sys

# Translation mappings - to be filled in manually or via simple translation
TRANSLATIONS_PL_FA = {}
TRANSLATIONS_DE_EN = {}

def load_batch(batch_num):
    """Load a batch file"""
    if batch_num == 1:
        with open('/Users/eldiaploo/Desktop/LingXM-Personal/data/ameeno/en_partial.json', 'r') as f:
            return json.load(f)
    else:
        with open(f'/tmp/vahiko_batch_{batch_num}.json', 'r') as f:
            return json.load(f)

def main():
    # Load completed batch 1
    all_entries = load_batch(1)
    print(f"Loaded batch 1: {len(all_entries)} entries", file=sys.stderr)

    # Load batches 2-9 (need to be translated)
    for batch_num in range(2, 10):
        try:
            batch = load_batch(batch_num)
            print(f"Loaded batch {batch_num}: {len(batch)} entries (structure only)", file=sys.stderr)
            # These need translation - for now just preserve structure
            all_entries.extend(batch)
        except FileNotFoundError:
            print(f"Batch {batch_num} not found", file=sys.stderr)
            continue

    print(f"\nTotal entries: {len(all_entries)}", file=sys.stderr)

    # Write combined file (with structure, translations needed for batches 2-9)
    output_file = '/Users/eldiaploo/Desktop/LingXM-Personal/data/ameeno/en_structure.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_entries, f, ensure_ascii=False, indent=2)

    print(f"\nWrote structure file: {output_file}", file=sys.stderr)

if __name__ == "__main__":
    main()
