#!/usr/bin/env python3
"""
Script to generate remaining Persian A1 vocabulary batches (8-25)
Uses Claude API to generate vocabulary with consistent format
"""

import json
import os
import sys
from pathlib import Path
import anthropic
import subprocess

# Configuration
BATCH_START = 8
BATCH_END = 25
PROMPTS_DIR = Path("prompts_batch2-25")
OUTPUT_DIR = Path("public/data/universal")
LANGUAGE_CODE = "fa"

# Initialize Anthropic client
client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

def read_prompt_file(batch_num):
    """Read the prompt file for a specific batch"""
    prompt_file = PROMPTS_DIR / f"{LANGUAGE_CODE}_batch{batch_num:02d}.md"

    if not prompt_file.exists():
        print(f"❌ Prompt file not found: {prompt_file}")
        return None

    with open(prompt_file, 'r', encoding='utf-8') as f:
        return f.read()

def read_reference_batch():
    """Read batch 1 as a reference for format"""
    reference_file = OUTPUT_DIR / f"{LANGUAGE_CODE}-a1-batch1.json"

    with open(reference_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_batch_vocabulary(batch_num, prompt_content, reference_format):
    """Generate vocabulary for a specific batch using Claude API"""

    # Create system prompt with reference format
    system_prompt = f"""You are an expert language learning content creator.
Generate Persian A1 vocabulary following EXACTLY the format provided.

CRITICAL REQUIREMENTS:
- EXACTLY 20 words per batch
- ALL 9 language translations (en, de, ar, fr, it, ru, es, pl, fa)
- Explanations in all 9 languages (1 sentence, A1-appropriate)
- 3 example sentences per language (27 examples per word)
- conjugations = null for all words
- Valid JSON with UTF-8 encoding
- Follow the EXACT format from the reference

Reference format (first entry from batch 1):
{json.dumps(reference_format[0], indent=2, ensure_ascii=False)}
"""

    user_prompt = f"""Generate batch {batch_num} vocabulary following the prompt below.

{prompt_content}

Return ONLY valid JSON (no markdown, no explanations). Use the exact structure from the reference."""

    print(f"🤖 Generating batch {batch_num} with Claude...")

    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=16000,
            temperature=1,
            system=system_prompt,
            messages=[
                {"role": "user", "content": user_prompt}
            ]
        )

        # Extract JSON from response
        response_text = message.content[0].text

        # Remove markdown code blocks if present
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0]
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0]

        # Parse and validate JSON
        batch_data = json.loads(response_text.strip())

        # Validate structure
        if not isinstance(batch_data, list):
            raise ValueError("Response is not a JSON array")

        if len(batch_data) != 20:
            print(f"⚠️  Warning: Batch {batch_num} has {len(batch_data)} words instead of 20")

        return batch_data

    except Exception as e:
        print(f"❌ Error generating batch {batch_num}: {e}")
        return None

def save_batch(batch_num, data):
    """Save batch data to JSON file"""
    output_file = OUTPUT_DIR / f"{LANGUAGE_CODE}-a1-batch{batch_num}.json"

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"✅ Saved: {output_file}")
    return output_file

def validate_json(file_path):
    """Validate JSON file with jq"""
    try:
        result = subprocess.run(
            ["jq", ".", str(file_path)],
            capture_output=True,
            text=True,
            check=True
        )
        print(f"✅ Valid JSON: {file_path.name}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Invalid JSON: {file_path.name}")
        print(e.stderr)
        return False

def commit_batch(batch_num, file_path):
    """Commit a batch to git"""
    try:
        # Add file
        subprocess.run(["git", "add", str(file_path)], check=True)

        # Create commit message
        commit_msg = f"""feat(vocab): Add Persian A1 batch {batch_num} (words {(batch_num-1)*20+1}-{batch_num*20})

Auto-generated with Claude API
Includes 20 words with 9-language translations

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"""

        # Commit
        subprocess.run(
            ["git", "commit", "-m", commit_msg],
            check=True,
            capture_output=True
        )

        print(f"✅ Committed batch {batch_num}")
        return True

    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to commit batch {batch_num}: {e}")
        return False

def main():
    """Main execution function"""
    print("=" * 70)
    print("Persian A1 Vocabulary Batch Generator")
    print("=" * 70)
    print(f"Generating batches {BATCH_START} to {BATCH_END}")
    print()

    # Check API key
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("❌ Error: ANTHROPIC_API_KEY environment variable not set")
        print("Set it with: export ANTHROPIC_API_KEY='your-key-here'")
        sys.exit(1)

    # Ensure output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Read reference format
    print("📖 Reading reference format from batch 1...")
    reference_format = read_reference_batch()
    print(f"✅ Reference format loaded ({len(reference_format)} words)")
    print()

    # Track statistics
    successful = []
    failed = []

    # Generate each batch
    for batch_num in range(BATCH_START, BATCH_END + 1):
        print(f"\n{'='*70}")
        print(f"Processing Batch {batch_num} (words {(batch_num-1)*20+1}-{batch_num*20})")
        print(f"{'='*70}")

        # Read prompt
        prompt_content = read_prompt_file(batch_num)
        if not prompt_content:
            failed.append(batch_num)
            continue

        # Generate vocabulary
        batch_data = generate_batch_vocabulary(batch_num, prompt_content, reference_format)
        if not batch_data:
            failed.append(batch_num)
            continue

        # Save to file
        output_file = save_batch(batch_num, batch_data)

        # Validate JSON
        if not validate_json(output_file):
            failed.append(batch_num)
            continue

        # Commit to git
        if commit_batch(batch_num, output_file):
            successful.append(batch_num)
        else:
            failed.append(batch_num)

    # Print summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"✅ Successful: {len(successful)} batches")
    print(f"   {successful}")
    print(f"❌ Failed: {len(failed)} batches")
    if failed:
        print(f"   {failed}")
    print()
    print(f"Total words generated: {len(successful) * 20}")
    print(f"Total translations: {len(successful) * 20 * 9}")
    print(f"Total examples: {len(successful) * 20 * 9 * 3}")
    print("=" * 70)

    # Push to remote
    if successful:
        print("\n🚀 Pushing to remote...")
        try:
            subprocess.run(["git", "push", "origin", "generation/fa-a1"], check=True)
            print("✅ Successfully pushed to remote!")
        except subprocess.CalledProcessError:
            print("⚠️  Failed to push. You may need to push manually.")

if __name__ == "__main__":
    main()
