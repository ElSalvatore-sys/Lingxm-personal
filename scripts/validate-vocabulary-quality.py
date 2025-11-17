#!/usr/bin/env python3
"""
Comprehensive Quality Validation Script for LingXM Vocabulary Files
Checks schema, translation coverage, explanations, examples, and cross-file consistency
"""

import json
import os
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Any, Tuple
import sys

# Configuration
LANGUAGES = ['en', 'de', 'es', 'ar', 'fr', 'it', 'ru', 'pl', 'fa']
EXPECTED_WORD_COUNT = {
    'en': 20, 'de': 20, 'es': 20, 'ar': 20,
    'fr': 50, 'it': 20, 'ru': 20, 'pl': 20, 'fa': 20
}
DATA_DIR = Path('public/data/universal')

# Schema fields that should be present
REQUIRED_FIELDS = ['id', 'word', 'category', 'frequency_rank', 'level',
                   'translations', 'explanation', 'examples', 'conjugations', 'cefrLevel']

class VocabularyValidator:
    def __init__(self):
        self.report = {
            'files_found': [],
            'files_missing': [],
            'validation_results': {},
            'cross_reference_check': {},
            'issues': [],
            'quality_score': 0
        }

    def validate_all_files(self):
        """Main validation entry point"""
        print("=" * 80)
        print("LingXM Vocabulary Quality Validation Report")
        print("=" * 80)

        # Check which files exist
        self.check_file_existence()

        # Validate each existing file
        for lang in self.report['files_found']:
            self.validate_file(lang)

        # Cross-reference validation
        if len(self.report['files_found']) > 1:
            self.cross_reference_validation()

        # Calculate quality score
        self.calculate_quality_score()

        # Generate reports
        self.print_summary()
        self.save_json_report()

        return self.report

    def check_file_existence(self):
        """Check which vocabulary files exist"""
        print("\n📁 Checking File Existence...")
        print("-" * 40)

        for lang in LANGUAGES:
            filepath = DATA_DIR / f"{lang}-a1-batch1.json"
            if filepath.exists():
                self.report['files_found'].append(lang)
                print(f"✅ {lang}-a1-batch1.json found")
            else:
                self.report['files_missing'].append(lang)
                print(f"❌ {lang}-a1-batch1.json MISSING")

        print(f"\nFiles found: {len(self.report['files_found'])}/{len(LANGUAGES)}")

    def validate_file(self, lang: str):
        """Validate a single vocabulary file"""
        filepath = DATA_DIR / f"{lang}-a1-batch1.json"

        print(f"\n📝 Validating {lang}-a1-batch1.json...")
        print("-" * 40)

        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)

            validation_result = {
                'word_count': len(data),
                'expected_word_count': EXPECTED_WORD_COUNT[lang],
                'word_count_correct': len(data) == EXPECTED_WORD_COUNT[lang],
                'schema_issues': [],
                'translation_coverage': {'complete': 0, 'partial': 0, 'missing': 0},
                'explanation_coverage': {'complete': 0, 'partial': 0, 'missing': 0},
                'example_coverage': {'complete': 0, 'partial': 0, 'missing': 0},
                'sample_words': [],
                'field_analysis': {}
            }

            # Check each word
            for i, word_entry in enumerate(data):
                # Schema validation
                schema_issues = self.validate_schema(word_entry, lang, i)
                validation_result['schema_issues'].extend(schema_issues)

                # Translation coverage
                trans_status = self.check_translation_coverage(word_entry, lang)
                validation_result['translation_coverage'][trans_status] += 1

                # Explanation coverage
                expl_status = self.check_explanation_coverage(word_entry)
                validation_result['explanation_coverage'][expl_status] += 1

                # Example coverage
                exam_status = self.check_example_coverage(word_entry)
                validation_result['example_coverage'][exam_status] += 1

                # Save first 3 words as samples
                if i < 3:
                    validation_result['sample_words'].append({
                        'word': word_entry.get('word') or word_entry.get(f'word_{lang}', 'UNKNOWN'),
                        'id': word_entry.get('id', 'MISSING'),
                        'translations_count': len(word_entry.get('translations', {})),
                        'explanations_count': len(word_entry.get('explanation', {})),
                        'examples_total': sum(len(word_entry.get('examples', {}).get(l, []))
                                            for l in LANGUAGES)
                    })

            # Analyze field presence
            if data:
                validation_result['field_analysis'] = self.analyze_fields(data[0])

            self.report['validation_results'][lang] = validation_result

            # Print summary for this file
            self.print_file_summary(lang, validation_result)

        except Exception as e:
            self.report['issues'].append(f"Error validating {lang}: {str(e)}")
            print(f"❌ Error: {str(e)}")

    def validate_schema(self, word_entry: Dict, lang: str, index: int) -> List[str]:
        """Validate schema for a word entry"""
        issues = []

        # Check for required fields
        for field in REQUIRED_FIELDS:
            if field == 'word':
                # Handle French file's different field name
                if field not in word_entry and f'word_{lang}' not in word_entry:
                    issues.append(f"Word {index}: Missing 'word' field")
            elif field not in word_entry:
                issues.append(f"Word {index}: Missing '{field}' field")

        # Check ID format
        if 'id' in word_entry:
            expected_prefix = f"universal_a1_"
            if not word_entry['id'].startswith(expected_prefix):
                issues.append(f"Word {index}: Invalid ID format - {word_entry['id']}")

        # Check CEFR level
        if 'cefrLevel' in word_entry and word_entry['cefrLevel'] != 'A1':
            issues.append(f"Word {index}: CEFR level is not A1 - {word_entry['cefrLevel']}")

        # Check conjugations is null
        if 'conjugations' in word_entry and word_entry['conjugations'] is not None:
            issues.append(f"Word {index}: Conjugations should be null")

        return issues

    def check_translation_coverage(self, word_entry: Dict, source_lang: str) -> str:
        """Check if word has all required translations"""
        translations = word_entry.get('translations', {})
        expected_langs = [l for l in LANGUAGES if l != source_lang]

        missing = []
        for lang in expected_langs:
            if lang not in translations or not translations[lang]:
                missing.append(lang)

        if len(missing) == 0:
            return 'complete'
        elif len(missing) < len(expected_langs):
            return 'partial'
        else:
            return 'missing'

    def check_explanation_coverage(self, word_entry: Dict) -> str:
        """Check if word has explanations in all languages"""
        explanations = word_entry.get('explanation', {})

        missing = []
        for lang in LANGUAGES:
            if lang not in explanations or not explanations[lang]:
                missing.append(lang)

        if len(missing) == 0:
            return 'complete'
        elif len(missing) < len(LANGUAGES):
            return 'partial'
        else:
            return 'missing'

    def check_example_coverage(self, word_entry: Dict) -> str:
        """Check if word has 3 examples in all languages"""
        examples = word_entry.get('examples', {})

        incomplete = []
        for lang in LANGUAGES:
            if lang not in examples:
                incomplete.append(lang)
            elif len(examples[lang]) != 3:
                incomplete.append(lang)

        if len(incomplete) == 0:
            return 'complete'
        elif len(incomplete) < len(LANGUAGES):
            return 'partial'
        else:
            return 'missing'

    def analyze_fields(self, sample_entry: Dict) -> Dict:
        """Analyze which fields are present in the data"""
        present_fields = list(sample_entry.keys())
        missing_fields = [f for f in REQUIRED_FIELDS if f not in sample_entry]

        # Check for alternative word field (French file)
        has_alt_word = any(k.startswith('word_') for k in sample_entry.keys())

        return {
            'present_fields': present_fields,
            'missing_fields': missing_fields,
            'has_alternative_word_field': has_alt_word,
            'extra_fields': [f for f in present_fields if f not in REQUIRED_FIELDS and not f.startswith('word_')]
        }

    def cross_reference_validation(self):
        """Check consistency across files for the same words"""
        print("\n🔄 Cross-Reference Validation...")
        print("-" * 40)

        # Get first word from each file for comparison
        first_words = {}
        for lang in self.report['files_found']:
            filepath = DATA_DIR / f"{lang}-a1-batch1.json"
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if data:
                        word_field = 'word' if 'word' in data[0] else f'word_{lang}'
                        first_words[lang] = {
                            'word': data[0].get(word_field, 'UNKNOWN'),
                            'translations': data[0].get('translations', {})
                        }
            except:
                pass

        # Check consistency
        consistency_check = []
        for lang, word_data in first_words.items():
            for other_lang, trans in word_data['translations'].items():
                if other_lang in first_words:
                    other_word = first_words[other_lang]['word']
                    matches = trans.lower() == other_word.lower()
                    consistency_check.append({
                        'source': lang,
                        'target': other_lang,
                        'expected': trans,
                        'actual': other_word,
                        'matches': matches
                    })

                    if matches:
                        print(f"✅ {lang} -> {other_lang}: '{trans}' = '{other_word}'")
                    else:
                        print(f"⚠️  {lang} -> {other_lang}: '{trans}' ≠ '{other_word}'")
                        self.report['issues'].append(
                            f"Translation mismatch: {lang} '{word_data['word']}' -> {other_lang} '{trans}' "
                            f"but {other_lang} file has '{other_word}'"
                        )

        self.report['cross_reference_check'] = {
            'first_words': first_words,
            'consistency_checks': consistency_check
        }

    def calculate_quality_score(self):
        """Calculate overall quality score"""
        total_points = 0
        max_points = 0

        # File existence (40 points)
        max_points += 40
        total_points += (len(self.report['files_found']) / len(LANGUAGES)) * 40

        # Schema compliance (20 points per file)
        for lang in self.report['files_found']:
            max_points += 20
            result = self.report['validation_results'].get(lang, {})
            if not result.get('schema_issues', []):
                total_points += 20
            else:
                # Deduct based on number of issues
                deduction = min(20, len(result['schema_issues']) * 2)
                total_points += max(0, 20 - deduction)

        # Translation coverage (15 points per file)
        for lang in self.report['files_found']:
            max_points += 15
            result = self.report['validation_results'].get(lang, {})
            trans_cov = result.get('translation_coverage', {})
            total_words = sum(trans_cov.values())
            if total_words > 0:
                complete_ratio = trans_cov.get('complete', 0) / total_words
                total_points += complete_ratio * 15

        # Explanation coverage (15 points per file)
        for lang in self.report['files_found']:
            max_points += 15
            result = self.report['validation_results'].get(lang, {})
            expl_cov = result.get('explanation_coverage', {})
            total_words = sum(expl_cov.values())
            if total_words > 0:
                complete_ratio = expl_cov.get('complete', 0) / total_words
                total_points += complete_ratio * 15

        # Example coverage (10 points per file)
        for lang in self.report['files_found']:
            max_points += 10
            result = self.report['validation_results'].get(lang, {})
            exam_cov = result.get('example_coverage', {})
            total_words = sum(exam_cov.values())
            if total_words > 0:
                complete_ratio = exam_cov.get('complete', 0) / total_words
                total_points += complete_ratio * 10

        if max_points > 0:
            self.report['quality_score'] = round((total_points / max_points) * 100, 2)
        else:
            self.report['quality_score'] = 0

    def print_file_summary(self, lang: str, result: Dict):
        """Print summary for a single file"""
        print(f"\n📊 {lang.upper()} Summary:")
        print(f"  Words: {result['word_count']}/{result['expected_word_count']} "
              f"{'✅' if result['word_count_correct'] else '⚠️'}")

        trans = result['translation_coverage']
        print(f"  Translations: {trans['complete']} complete, "
              f"{trans['partial']} partial, {trans['missing']} missing")

        expl = result['explanation_coverage']
        print(f"  Explanations: {expl['complete']} complete, "
              f"{expl['partial']} partial, {expl['missing']} missing")

        exam = result['example_coverage']
        print(f"  Examples: {exam['complete']} complete, "
              f"{exam['partial']} partial, {exam['missing']} missing")

        if result['schema_issues']:
            print(f"  ⚠️  Schema issues: {len(result['schema_issues'])}")

    def print_summary(self):
        """Print overall summary"""
        print("\n" + "=" * 80)
        print("OVERALL SUMMARY")
        print("=" * 80)

        print(f"\n📁 File Coverage: {len(self.report['files_found'])}/{len(LANGUAGES)}")
        print(f"   Found: {', '.join(self.report['files_found'])}")
        if self.report['files_missing']:
            print(f"   Missing: {', '.join(self.report['files_missing'])}")

        print(f"\n🎯 Quality Score: {self.report['quality_score']}%")

        if self.report['issues']:
            print(f"\n⚠️  Issues Found ({len(self.report['issues'])}):")
            for issue in self.report['issues'][:10]:  # Show first 10 issues
                print(f"   - {issue}")
            if len(self.report['issues']) > 10:
                print(f"   ... and {len(self.report['issues']) - 10} more")
        else:
            print("\n✅ No major issues found!")

        print("\n" + "=" * 80)

    def save_json_report(self):
        """Save detailed JSON report"""
        report_path = Path('validation-quality-report.json')

        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(self.report, f, indent=2, ensure_ascii=False)

        print(f"\n💾 Detailed report saved to: {report_path}")

def main():
    """Main entry point"""
    validator = VocabularyValidator()
    report = validator.validate_all_files()

    # Return exit code based on quality score
    if report['quality_score'] >= 90:
        sys.exit(0)  # Success
    else:
        sys.exit(1)  # Issues found

if __name__ == "__main__":
    main()