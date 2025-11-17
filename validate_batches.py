#!/usr/bin/env python3
import json
import sys
from pathlib import Path

def validate_batch(batch_num):
    """Validate a single batch file."""
    file_path = Path(f"/home/user/Lingxm-personal/public/data/universal/pl-a1-batch{batch_num}.json")

    if not file_path.exists():
        return {"status": "MISSING", "errors": ["File does not exist"]}

    errors = []
    warnings = []

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        return {"status": "INVALID_JSON", "errors": [f"JSON parsing error: {e}"]}
    except Exception as e:
        return {"status": "ERROR", "errors": [f"File read error: {e}"]}

    # Check word count
    word_count = len(data)
    if word_count != 20:
        errors.append(f"Expected 20 words, found {word_count}")

    # Validate each word entry
    required_fields = ["id", "word", "category", "frequency_rank", "level",
                      "translations", "explanation", "examples", "conjugations", "cefrLevel"]
    required_languages = ["en", "de", "ar", "fr", "it", "ru", "es", "pl", "fa"]

    for idx, entry in enumerate(data):
        word_num = (batch_num - 1) * 20 + idx + 1
        expected_id = f"universal_a1_{word_num:03d}_pl"

        # Check all required fields exist
        for field in required_fields:
            if field not in entry:
                errors.append(f"Word {idx+1}: Missing field '{field}'")

        # Check ID format
        if entry.get("id") != expected_id:
            errors.append(f"Word {idx+1}: Expected ID '{expected_id}', got '{entry.get('id')}'")

        # Check CEFR level
        if entry.get("cefrLevel") != "A1":
            errors.append(f"Word {idx+1}: Expected cefrLevel 'A1', got '{entry.get('cefrLevel')}'")

        if entry.get("level") != "a1":
            errors.append(f"Word {idx+1}: Expected level 'a1', got '{entry.get('level')}'")

        # Check translations
        if "translations" in entry:
            for lang in required_languages:
                if lang not in entry["translations"]:
                    errors.append(f"Word {idx+1}: Missing translation for '{lang}'")

        # Check examples
        if "examples" in entry:
            for lang in required_languages:
                if lang not in entry["examples"]:
                    errors.append(f"Word {idx+1}: Missing examples for '{lang}'")
                elif len(entry["examples"][lang]) != 3:
                    warnings.append(f"Word {idx+1}: Expected 3 examples for '{lang}', got {len(entry['examples'][lang])}")

    if errors:
        return {"status": "FAILED", "errors": errors, "warnings": warnings, "word_count": word_count}
    elif warnings:
        return {"status": "WARNING", "errors": [], "warnings": warnings, "word_count": word_count}
    else:
        return {"status": "PASSED", "errors": [], "warnings": [], "word_count": word_count}

def main():
    print("=" * 80)
    print("POLISH A1 BATCH VALIDATION REPORT")
    print("=" * 80)
    print()

    total_words = 0
    passed = 0
    failed = 0
    warnings_count = 0

    results = []

    for batch_num in range(1, 26):
        result = validate_batch(batch_num)
        results.append((batch_num, result))

        total_words += result.get("word_count", 0)

        if result["status"] == "PASSED":
            passed += 1
            status_symbol = "✅"
        elif result["status"] == "WARNING":
            warnings_count += 1
            status_symbol = "⚠️"
        else:
            failed += 1
            status_symbol = "❌"

        start_word = (batch_num - 1) * 20 + 1
        end_word = batch_num * 20

        print(f"{status_symbol} Batch {batch_num:2d} (words {start_word:3d}-{end_word:3d}): {result['status']:12s} - {result.get('word_count', 0)} words")

        if result["errors"]:
            for error in result["errors"][:5]:  # Show first 5 errors
                print(f"    ERROR: {error}")
            if len(result["errors"]) > 5:
                print(f"    ... and {len(result['errors']) - 5} more errors")

        if result["warnings"]:
            for warning in result["warnings"][:3]:  # Show first 3 warnings
                print(f"    WARN: {warning}")
            if len(result["warnings"]) > 3:
                print(f"    ... and {len(result['warnings']) - 3} more warnings")

    print()
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Total batches: 25")
    print(f"Passed: {passed}")
    print(f"Warnings: {warnings_count}")
    print(f"Failed: {failed}")
    print(f"Total words: {total_words}")
    print()

    if failed == 0:
        print("✅ ALL VALIDATIONS PASSED!")
        return 0
    else:
        print(f"❌ {failed} batch(es) failed validation")
        return 1

if __name__ == "__main__":
    sys.exit(main())
