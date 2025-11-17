#!/usr/bin/env python3
import sys
from automate_vocabulary import VocabularyAutomation

LANGUAGES = {
    'en': ('English', 'generation/en-a1', 2, 25),
    'de': ('German', 'generation/de-a1', 2, 25),
    'es': ('Spanish', 'generation/es-a1', 2, 25),
    'ar': ('Arabic', 'generation/ar-a1', 2, 25),
    'fr': ('French', 'generation/fr-a1', 3, 25),
    'it': ('Italian', 'generation/it-a1', 2, 25),
    'ru': ('Russian', 'generation/ru-a1', 2, 25),
    'pl': ('Polish', 'generation/pl-a1', 2, 25),
    'fa': ('Persian', 'generation/fa-a1', 2, 25)
}

if len(sys.argv) < 2:
    print("Usage: python3 run_parallel.py <language_code>")
    print("Languages: en, de, es, ar, fr, it, ru, pl, fa")
    sys.exit(1)

lang = sys.argv[1]
if lang not in LANGUAGES:
    print(f"Unknown language: {lang}")
    sys.exit(1)

automation = VocabularyAutomation(test_mode=False)
lang_name, branch, start, end = LANGUAGES[lang]

print(f"Starting {lang_name} automation...")
print(f"Batches {start}-{end}")

if not automation.checkout_branch(branch):
    print(f"Failed to checkout {branch}")
    sys.exit(1)

for batch_num in range(start, end + 1):
    success = automation.process_batch(lang, lang_name, batch_num)
    if not success:
        print(f"Failed at batch {batch_num}")
        sys.exit(1)

print(f"{lang_name} complete! Pushing to remote...")
automation.run_command(f"git push origin {branch}")
print(f"✅ {lang_name} DONE!")