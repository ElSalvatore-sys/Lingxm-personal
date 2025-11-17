# Frequency-Based Vocabulary Master Lists

## Overview

This directory contains frequency-based master word lists for vocabulary generation, organized by language and CEFR level.

## Structure

```
frequency-lists/
├── en/                  # English
│   ├── a1.json         # 500 words
│   ├── a2.json         # 500 words
│   ├── b1.json         # 600 words
│   ├── b2.json         # 600 words
│   ├── c1.json         # 500 words
│   └── c2.json         # 300 words
├── de/                  # German
├── fr/                  # French
├── it/                  # Italian
├── ru/                  # Russian
├── ar/                  # Arabic
└── domains/             # Domain-specific vocabularies
    ├── business/
    ├── gastronomy/
    ├── it-tech/
    └── medical/
```

## Data Format

Each JSON file contains an array of word objects:

```json
[
  {
    "word": "hello",
    "frequency_rank": 45,
    "category": "courtesies",
    "part_of_speech": "interjection",
    "cefr_level": "A1",
    "source": "COCA",
    "notes": "Essential greeting"
  }
]
```

## Sources

### CEFR Official Lists
- **English**: Cambridge English Vocabulary Profile
- **German**: Goethe Institut CEFR lists
- **French**: DELF/DALF word lists
- **Italian**: CELI word lists
- **Russian**: TORFL word lists
- **Arabic**: ArabiCorpus + CEFR alignment

### Corpus Frequency Data
- **English**: COCA (Corpus of Contemporary American English)
- **German**: DWDS frequency lists
- **French**: Lexique 3 database
- **Italian**: COLFIS corpus
- **Russian**: Russian National Corpus
- **Arabic**: ArabiCorpus

### Additional Resources
- **Kelly Project**: 9 European languages, 8,000 words each
- **Swadesh Lists**: 207 universal core words (A1 foundation)

## Generation Process

1. Extract CEFR official list (if available)
2. Cross-reference with corpus frequency data (top 10,000)
3. Filter by frequency rank per level:
   - A1: Top 500 most frequent
   - A2: Rank 501-1,500
   - B1: Rank 1,501-3,000
   - B2: Rank 3,001-5,000
   - C1: Rank 5,001-8,000
   - C2: Rank 8,001-12,000
4. Add domain-specific terms at B1+ levels
5. Validate every word can be used in i+1 sentence structures

## Target Distribution

| Level | Word Count | Cumulative | Frequency Range | Focus |
|-------|-----------|------------|-----------------|-------|
| A1 | 500 | 500 | Top 500 | Survival vocabulary |
| A2 | 500 | 1,000 | 501-1,500 | Everyday situations |
| B1 | 600 | 1,600 | 1,501-3,000 | Independence |
| B2 | 600 | 2,200 | 3,001-5,000 | Professional contexts |
| C1 | 500 | 2,700 | 5,001-8,000 | Academic/formal |
| C2 | 300 | 3,000 | 8,001-12,000 | Mastery/nuance |

**Total per language**: 3,000 general words + up to 3,600 domain-specific words

## Quality Control

- Every word validated against frequency corpora
- CEFR level confirmed by official sources
- i+1 sentence compatibility verified
- Part of speech tagged
- Usage context noted (formal/informal, written/spoken)

---

**Status**: Structure created, awaiting word list population
**Last Updated**: 2025-11-08
