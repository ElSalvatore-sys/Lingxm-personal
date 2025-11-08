# LingXM Universal Platform - Terminal Assignments

## Overview
This document provides detailed git commands and content generation instructions for each terminal session working on the LingXM Universal Platform transformation.

**Repository:** https://github.com/ElSalvatore-sys/Lingxm-personal.git
**Parent Branch:** `feature/universal-platform`
**Total Terminals:** 13 terminals across 4 weeks
**Timeline:** 4 weeks (November 8 - December 6, 2025)

---

## Quick Start Commands

### Initial Setup (All Terminals)
```bash
cd ~/Desktop/LingXM-Personal
git fetch origin
git pull origin main
```

---

## WEEK 1: Foundation (Days 1-7)
**Goal:** Core English content + Spanish A1-A2 + Database schema
**Terminals Active:** 7
**Deliverable:** 3,000 English sentences + 1,000 Spanish sentences + Schema

---

### T1: Database Schema Implementation
**Branch:** `generation/db-schema`
**Owner:** [Assign team member]
**Duration:** 7 days
**Priority:** HIGH (blocks Week 2)

#### Setup Commands
```bash
git checkout generation/db-schema
git pull origin generation/db-schema
```

#### Tasks
1. Create `/scripts/schema.sql` for universal language support
2. Update `src/utils/database.js` for new schema
3. Add migration scripts for existing data
4. Test with English + Spanish data
5. Document schema in `/docs/DATABASE_SCHEMA.md`

#### Deliverables
- [ ] Schema supports all 7 languages (en, es, de, fr, it, ar, ru)
- [ ] Backward compatible with existing data
- [ ] Migration scripts tested
- [ ] Performance benchmarks documented

#### Commit & Push
```bash
git add scripts/schema.sql src/utils/database.js docs/DATABASE_SCHEMA.md
git commit -m "feat(db): Universal schema for multi-language platform

- Add support for 7 languages
- Backward compatible migration
- Performance optimized indexes
- Comprehensive documentation"
git push origin generation/db-schema
```

---

### T2: English A1 Generation
**Branch:** `generation/en-a1`
**Owner:** [Assign team member]
**Duration:** 5-7 days
**Target:** 500 words × 3 sentences = 1,500 sentences

#### Setup Commands
```bash
git checkout generation/en-a1
git pull origin generation/en-a1
```

#### Content Specifications
- **Level:** A1 (Beginner)
- **Words:** 500 most common English words
- **Sentences per word:** 3
- **Total sentences:** 1,500
- **Quality target:** ≥95%

#### Generation Process
1. Use CEFR A1 word list for English
2. Generate 3 sentences per word using Claude
3. Validate each sentence:
   - Contains target word (exact match)
   - Has exactly 5 underscores (_____)
   - Natural grammar
   - A1-appropriate complexity
4. Save to `/public/data/sentences/en/en-a1-sentences.json`

#### File Structure
```json
{
  "metadata": {
    "language": "en",
    "language_name": "English",
    "level": "A1",
    "total_words": 500,
    "total_sentences": 1500,
    "generated_date": "2025-11-XX",
    "version": "4.0-universal-platform",
    "quality_score": "XX/100"
  },
  "sentences": [
    {
      "id": "en-a1-hello-001",
      "sentence": "I always say _____ when I meet my friends in the morning.",
      "word": "hello",
      "level": "A1",
      "translation": "Translation in target language"
    }
  ]
}
```

#### Commit & Push
```bash
git add public/data/sentences/en/en-a1-sentences.json
git commit -m "feat(content): English A1 - 500 words + 1,500 sentences

- CEFR A1 word list coverage
- Quality score: XX/100
- All sentences validated
- i+1 algorithm compatible"
git push origin generation/en-a1
```

---

### T3: English A2 Generation
**Branch:** `generation/en-a2`
**Owner:** [Assign team member]
**Duration:** 5-7 days
**Target:** 500 words × 3 sentences = 1,500 sentences

#### Setup Commands
```bash
git checkout generation/en-a2
git pull origin generation/en-a2
```

#### Content Specifications
Same as T2, but for A2 level (Elementary)
- **File:** `/public/data/sentences/en/en-a2-sentences.json`
- **Words:** Next 500 most common words (beyond A1)
- **Complexity:** Slightly more complex grammar than A1

---

### T4: English B1 Generation
**Branch:** `generation/en-b1`
**Owner:** [Assign team member]
**Duration:** 5-7 days
**Target:** 500 words × 3 sentences = 1,500 sentences

#### Setup Commands
```bash
git checkout generation/en-b1
git pull origin generation/en-b1
```

#### Content Specifications
- **Level:** B1 (Intermediate)
- **File:** `/public/data/sentences/en/en-b1-sentences.json`
- **Words:** CEFR B1 word list
- **Complexity:** Intermediate grammar, compound sentences

---

### T5: English B2 Generation
**Branch:** `generation/en-b2`
**Owner:** [Assign team member]
**Duration:** 5-7 days
**Target:** 500 words × 3 sentences = 1,500 sentences

#### Setup Commands
```bash
git checkout generation/en-b2
git pull origin generation/en-b2
```

#### Content Specifications
- **Level:** B2 (Upper Intermediate)
- **File:** `/public/data/sentences/en/en-b2-sentences.json`
- **Words:** CEFR B2 word list
- **Complexity:** Advanced grammar, idiomatic expressions

---

### T6: Spanish A1 Generation
**Branch:** `generation/es-a1`
**Owner:** [Assign team member]
**Duration:** 5-7 days
**Target:** 500 words × 3 sentences = 1,500 sentences

#### Setup Commands
```bash
git checkout generation/es-a1
git pull origin generation/es-a1
```

#### Content Specifications
- **Level:** A1 (Beginner)
- **File:** `/public/data/sentences/es/es-a1-sentences.json`
- **Words:** DELE A1 word list (Spanish CEFR)
- **Target:** 350M+ Spanish speakers worldwide
- **Quality:** Follow Russian model (100% quality achieved)

#### Spanish-Specific Requirements
- Use official DELE (Diplomas of Spanish as a Foreign Language) word lists
- Ensure gender agreement (el/la, un/una)
- Include both European and Latin American vocabulary where relevant
- Verify accents (á, é, í, ó, ú, ñ)

#### Example Sentence
```json
{
  "id": "es-a1-hola-001",
  "sentence": "Siempre digo _____ cuando veo a mis amigos por la mañana.",
  "word": "hola",
  "level": "A1",
  "translation": "I always say hello when I see my friends in the morning."
}
```

---

### T7: Spanish A2 Generation
**Branch:** `generation/es-a2`
**Owner:** [Assign team member]
**Duration:** 5-7 days
**Target:** 500 words × 3 sentences = 1,500 sentences

#### Setup Commands
```bash
git checkout generation/es-a2
git pull origin generation/es-a2
```

#### Content Specifications
- **Level:** A2 (Elementary)
- **File:** `/public/data/sentences/es/es-a2-sentences.json`
- **Words:** DELE A2 word list

---

## WEEK 2: Expansion (Days 8-14)
**Goal:** Complete Spanish B1-B2 + Fill language gaps
**Terminals Active:** 5
**Deliverable:** 3,000 Spanish sentences + German/French/Italian completion

---

### T6 (continued): Spanish B1 Generation
**Branch:** `generation/es-b1`
**Target:** 500 words × 3 sentences = 1,500 sentences

#### Setup Commands
```bash
git checkout generation/es-b1
git pull origin generation/es-b1
```

#### Content Specifications
- **Level:** B1 (Intermediate)
- **File:** `/public/data/sentences/es/es-b1-sentences.json`
- **Words:** DELE B1 word list

---

### T7 (continued): Spanish B2 Generation
**Branch:** `generation/es-b2`
**Target:** 500 words × 3 sentences = 1,500 sentences

#### Setup Commands
```bash
git checkout generation/es-b2
git pull origin generation/es-b2
```

#### Content Specifications
- **Level:** B2 (Upper Intermediate)
- **File:** `/public/data/sentences/es/es-b2-sentences.json`
- **Words:** DELE B2 word list

---

### T8: German A1-A2 Completion
**Branch:** `generation/de-a1-a2`
**Owner:** [Assign team member]
**Duration:** 7 days
**Target:** 1,000 words × 3 sentences = 3,000 sentences

#### Setup Commands
```bash
git checkout generation/de-a1-a2
git pull origin generation/de-a1-a2
```

#### Content Specifications
- **Levels:** A1 + A2
- **Files:**
  - `/public/data/sentences/de/de-a1-sentences.json`
  - `/public/data/sentences/de/de-a2-sentences.json`
- **Words:** Goethe-Zertifikat A1-A2 word lists

#### German-Specific Requirements
- Capitalize all nouns (das Haus, die Katze, der Mann)
- Include articles in compound nouns
- Verify umlauts (ä, ö, ü, ß)
- Case-appropriate (Nominativ, Akkusativ, Dativ, Genitiv)

---

### T9: French General Content Completion
**Branch:** `generation/fr-complete`
**Owner:** [Assign team member]
**Duration:** 7 days

#### Setup Commands
```bash
git checkout generation/fr-complete
git pull origin generation/fr-complete
```

#### Tasks
1. Analyze existing French content in `/public/data/sentences/fr/`
2. Generate missing A1-B2 general vocabulary
3. Complete sentence files
4. Validate quality

#### French-Specific Requirements
- Verify accents (é, è, ê, à, ù, ç)
- Gender agreement (le/la, un/une)
- Liaison rules in example sentences

---

### T10: Italian General Content Completion
**Branch:** `generation/it-complete`
**Owner:** [Assign team member]
**Duration:** 7 days

#### Setup Commands
```bash
git checkout generation/it-complete
git pull origin generation/it-complete
```

#### Tasks
1. Analyze existing Italian content in `/public/data/sentences/it/`
2. Generate missing A1-B2 general vocabulary
3. Complete sentence files
4. Validate quality

#### Italian-Specific Requirements
- Verify accents (à, è, é, ì, ò, ù)
- Gender agreement (il/la, un/una)
- Double consonants (esempio: "cassa" vs "casa")

---

## WEEK 3: Polish & UI (Days 15-21)
**Goal:** UI improvements + Conjugations + Quality validation
**Terminals Active:** 3

---

### T11: Onboarding Flow UI
**Branch:** `feature/onboarding-flow`
**Owner:** [Assign team member]
**Duration:** 7 days

#### Setup Commands
```bash
git checkout feature/onboarding-flow
git pull origin feature/onboarding-flow
```

#### Tasks
1. Design new user onboarding screens
2. Language selection interface
3. Level assessment quiz
4. Profile creation flow
5. Tutorial for sentence practice mode

#### Files to Modify
- `src/app.js` - Add onboarding logic
- `src/styles/main.css` - Onboarding styles
- Create `/src/components/onboarding/` directory

---

### T12: Profile Management System
**Branch:** `feature/profile-management`
**Owner:** [Assign team member]
**Duration:** 7 days

#### Setup Commands
```bash
git checkout feature/profile-management
git pull origin feature/profile-management
```

#### Tasks
1. User profile CRUD operations
2. Language preferences management
3. Progress tracking dashboard
4. Multiple profile support

---

### T13: Conjugations Validation
**Branch:** `generation/conjugations`
**Owner:** [Assign team member]
**Duration:** 7 days

#### Setup Commands
```bash
git checkout generation/conjugations
git pull origin generation/conjugations
```

#### Tasks
1. Validate existing conjugations in vocabulary files
2. Add missing conjugations for all new words
3. Verify verb forms across all languages
4. Quality check: 100% conjugation coverage

---

## WEEK 4: Testing & Launch Prep (Days 22-28)
**Goal:** Bug fixes, testing, deployment readiness
**Terminals Active:** 2-3

### Tasks
- Integration testing across all languages
- Performance optimization
- iOS build and testing
- Production deployment preparation
- Beta user testing

---

## Daily Workflow (All Terminals)

### Morning Routine
```bash
# 1. Pull latest changes
git checkout <your-branch>
git pull origin <your-branch>

# 2. Pull parent branch updates
git fetch origin feature/universal-platform
git merge origin/feature/universal-platform

# 3. Start work
npm run dev
```

### End of Day
```bash
# 1. Test your changes
npm run dev

# 2. Commit changes
git add .
git commit -m "feat(content): [Description]"

# 3. Push to remote
git push origin <your-branch>
```

### Conflict Resolution
If you encounter merge conflicts:
```bash
# 1. Fetch latest
git fetch origin feature/universal-platform

# 2. Merge with strategy
git merge origin/feature/universal-platform --strategy-option theirs

# 3. Review conflicts manually
git status

# 4. Resolve and commit
git add .
git commit -m "chore: Resolve merge conflicts with parent branch"
```

---

## Communication Protocol

### Daily Standup (Async)
Post in Slack/Discord channel:
```
Terminal: T[X]
Branch: generation/[branch-name]
Progress: [X]/[Y] sentences completed
Blockers: [None / List blockers]
ETA: [X] days remaining
```

### Weekly Quality Gates
Every Friday:
1. Push all work to branch
2. Run quality validation
3. Report metrics to project lead
4. Merge approved branches to parent

---

## Quality Metrics Dashboard

Track progress using this template:

| Terminal | Branch | Words | Sentences | Quality | Status |
|----------|--------|-------|-----------|---------|--------|
| T1 | generation/db-schema | N/A | N/A | N/A | In Progress |
| T2 | generation/en-a1 | 500 | 1,500 | XX% | In Progress |
| T3 | generation/en-a2 | 500 | 1,500 | XX% | Pending |
| T4 | generation/en-b1 | 500 | 1,500 | XX% | Pending |
| T5 | generation/en-b2 | 500 | 1,500 | XX% | Pending |
| T6 | generation/es-a1 | 500 | 1,500 | XX% | In Progress |
| T7 | generation/es-a2 | 500 | 1,500 | XX% | In Progress |
| T8 | generation/de-a1-a2 | 1,000 | 3,000 | XX% | Pending |
| T9 | generation/fr-complete | TBD | TBD | XX% | Pending |
| T10 | generation/it-complete | TBD | TBD | XX% | Pending |
| T11 | feature/onboarding-flow | N/A | N/A | N/A | Pending |
| T12 | feature/profile-management | N/A | N/A | N/A | Pending |
| T13 | generation/conjugations | N/A | N/A | N/A | Pending |

**Total Estimated Content:** ~10,000+ sentences across 7 languages

---

## Emergency Contacts

**Project Lead:** [Name]
**Git Issues:** Check `/docs/GIT_TROUBLESHOOTING.md`
**Content Questions:** See `/docs/CONTENT_GUIDELINES.md`

---

## Success Criteria

### Week 1 Gate
- [ ] English A1-B2 complete (6,000 sentences)
- [ ] Spanish A1-A2 complete (3,000 sentences)
- [ ] Database schema functional
- [ ] All branches merged to parent

### Week 2 Gate
- [ ] Spanish B1-B2 complete (3,000 sentences)
- [ ] German A1-A2 complete (3,000 sentences)
- [ ] French/Italian gaps filled
- [ ] All content validated

### Week 3 Gate
- [ ] UI features complete
- [ ] Conjugations validated
- [ ] Integration testing passed

### Week 4 Gate
- [ ] Production build successful
- [ ] iOS app builds
- [ ] Beta testing complete
- [ ] Ready for launch

---

**Last Updated:** 2025-11-08
**Version:** 1.0
**Status:** Active
