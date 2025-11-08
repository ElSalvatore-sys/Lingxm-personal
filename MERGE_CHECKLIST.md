# LingXM Universal Platform - Merge Checklist & Quality Gates

## Overview
This document defines the quality standards, validation procedures, and merge protocols for the LingXM Universal Platform project. All branches must pass these gates before merging.

**Parent Branch:** `feature/universal-platform`
**Target Branch:** `main`
**Merge Strategy:** `--no-ff` (preserve history)

---

## Table of Contents
1. [Quality Gates](#quality-gates)
2. [Validation Scripts](#validation-scripts)
3. [Merge Procedures](#merge-procedures)
4. [Conflict Resolution](#conflict-resolution)
5. [Rollback Procedures](#rollback-procedures)

---

## Quality Gates

### 🔴 GATE 1: Content Validation (All Generation Branches)

Before merging any `generation/*` branch, verify:

#### JSON Structure
- [ ] All files are valid JSON (no syntax errors)
- [ ] File size < 5MB (performance requirement)
- [ ] UTF-8 encoding (supports all languages)
- [ ] No trailing commas

**Validation Command:**
```bash
# Validate JSON structure
for file in public/data/sentences/**/*.json; do
  if ! jq empty "$file" 2>/dev/null; then
    echo "Invalid JSON: $file"
  fi
done
```

#### Metadata Requirements
Every sentence file must include:
```json
{
  "metadata": {
    "language": "en",           // ISO 639-1 code
    "language_name": "English",  // Full language name
    "level": "A1",              // CEFR level
    "total_words": 500,         // Word count
    "total_sentences": 1500,    // Sentence count
    "generated_date": "2025-11-XX",
    "version": "4.0-universal-platform",
    "quality_score": "95/100"   // Must be ≥95
  }
}
```

- [ ] All metadata fields present
- [ ] Quality score ≥ 95/100
- [ ] Version matches project version
- [ ] Date is current generation date

#### Sentence Quality Standards
Each sentence must have:

1. **Target Word Match**
   - [ ] Target word appears in sentence (exact match)
   - [ ] Case-insensitive verification allowed
   - [ ] No partial matches (e.g., "run" in "running")

2. **Blank Format**
   - [ ] Exactly 5 underscores: `_____`
   - [ ] Surrounded by spaces: ` _____ `
   - [ ] Only ONE blank per sentence
   - [ ] No extra underscores elsewhere

3. **Grammar & Readability**
   - [ ] Natural sentence structure
   - [ ] Grammatically correct
   - [ ] Appropriate level complexity (A1 = simple, C2 = complex)
   - [ ] No offensive or inappropriate content

4. **Unique IDs**
   - [ ] Format: `{language}-{level}-{word}-{number}`
   - [ ] Example: `en-a1-hello-001`
   - [ ] No duplicate IDs in file
   - [ ] Sequential numbering (001, 002, 003...)

5. **Translation Present**
   - [ ] Translation field not empty
   - [ ] Accurate translation
   - [ ] Same meaning as original sentence

**Validation Script:** `scripts/validate-sentences.js`

```javascript
// Run validation
node scripts/validate-sentences.js public/data/sentences/en/en-a1-sentences.json
```

Expected output:
```
✓ JSON valid
✓ Metadata complete
✓ Quality score: 96/100
✓ 1,500 sentences validated
✓ All IDs unique
✓ All blanks formatted correctly
✓ All target words present
✓ Ready to merge
```

#### No Duplicates
- [ ] No duplicate sentences across files
- [ ] No duplicate words within same level
- [ ] No duplicate IDs across all files

---

### 🟡 GATE 2: Integration Testing (All Branches)

#### Build Test
```bash
# Clean build
rm -rf dist/
npm run build

# Should complete without errors
# dist/ folder should be generated
```

- [ ] Build completes successfully
- [ ] No TypeScript errors (if applicable)
- [ ] No console warnings
- [ ] dist/ folder generated

#### Development Server Test
```bash
npm run dev
# Open http://localhost:5173
```

- [ ] Server starts without errors
- [ ] App loads in browser
- [ ] No console errors in browser
- [ ] No 404s for resources

#### Functional Testing
Test the following features:

1. **Sentence Practice Mode**
   - [ ] Select language dropdown works
   - [ ] Select level dropdown works
   - [ ] Sentences load correctly
   - [ ] Blank (____) appears in sentence
   - [ ] Can type answer in blank
   - [ ] Answer validation works
   - [ ] Score tracking works

2. **TTS (Text-to-Speech)**
   - [ ] Speaker icon appears
   - [ ] Click speaker plays audio
   - [ ] Correct pronunciation (verify manually)
   - [ ] Works for all new languages

3. **i+1 Algorithm**
   - [ ] Only shows words user knows + 1 new word
   - [ ] Progress tracking updates
   - [ ] Difficulty adapts to user level

4. **Data Loading**
   - [ ] New sentence files load
   - [ ] No 404 errors in network tab
   - [ ] Data displays correctly in UI

---

### 🟢 GATE 3: Code Quality (Feature Branches Only)

For `feature/*` branches only:

#### Code Standards
- [ ] ESLint passes (if configured)
- [ ] No console.log statements (use proper logging)
- [ ] No commented-out code blocks
- [ ] Proper error handling
- [ ] Functions documented

#### Security Check
- [ ] No hardcoded credentials
- [ ] No API keys in code
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Input validation present

#### Performance
- [ ] No memory leaks
- [ ] Efficient DOM manipulation
- [ ] Lazy loading implemented where needed
- [ ] No N+1 query patterns

---

### 🔵 GATE 4: Database Schema (generation/db-schema Only)

Special requirements for database schema branch:

#### Schema Validation
- [ ] SQL syntax valid
- [ ] Tables properly indexed
- [ ] Foreign keys defined
- [ ] Constraints defined (NOT NULL, UNIQUE, etc.)

#### Migration Test
```bash
# Test migration on clean database
rm -rf data/lingxm.db
node scripts/migrate-database.js
```

- [ ] Migration runs without errors
- [ ] All tables created
- [ ] Sample data loads correctly
- [ ] Old data preserved (if upgrade)

#### Backward Compatibility
- [ ] Existing vocabulary files still work
- [ ] Existing sentence files still work
- [ ] No breaking changes to API
- [ ] Migration path documented

---

## Validation Scripts

### Automated Validation Script

Create `scripts/validate-branch.sh`:

```bash
#!/bin/bash
# Automated branch validation script

set -e

echo "🔍 Starting branch validation..."

# 1. JSON Validation
echo "📄 Validating JSON files..."
for file in public/data/sentences/**/*.json; do
  if ! jq empty "$file" 2>/dev/null; then
    echo "❌ Invalid JSON: $file"
    exit 1
  fi
done
echo "✅ All JSON files valid"

# 2. Sentence Validation
echo "📝 Validating sentences..."
node scripts/validate-sentences.js

# 3. Build Test
echo "🏗️  Testing build..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Build successful"
else
  echo "❌ Build failed"
  exit 1
fi

# 4. Check for duplicates
echo "🔎 Checking for duplicates..."
node scripts/check-duplicates.js

echo "✅ All validation gates passed!"
echo "🚀 Branch ready to merge"
```

Make executable:
```bash
chmod +x scripts/validate-branch.sh
```

Run before merge:
```bash
./scripts/validate-branch.sh
```

---

## Merge Procedures

### Procedure 1: Generation Branch → Parent (Weekly)

**When:** End of each week or when work is complete
**Who:** Terminal owner
**Review:** Project lead approval required

#### Steps

1. **Validate Branch**
```bash
# Switch to your branch
git checkout generation/en-a1

# Pull latest changes
git pull origin generation/en-a1

# Run validation
./scripts/validate-branch.sh
```

2. **Update from Parent**
```bash
# Fetch parent branch
git fetch origin feature/universal-platform

# Merge parent into your branch (resolve conflicts first)
git merge origin/feature/universal-platform

# Test again after merge
npm run dev
```

3. **Create Pull Request**
```bash
# Push final changes
git push origin generation/en-a1

# Create PR on GitHub
gh pr create \
  --base feature/universal-platform \
  --head generation/en-a1 \
  --title "feat(content): English A1 - 500 words + 1,500 sentences" \
  --body "$(cat <<'EOF'
## Summary
- Generated 500 A1-level English words
- Created 1,500 validated sentences
- Quality score: 96/100
- All validation gates passed

## Test Plan
- [x] JSON validation passed
- [x] Sentence quality ≥95%
- [x] Build successful
- [x] App functional testing passed
- [x] TTS works for new content
- [x] No duplicates found

## Files Changed
- `public/data/sentences/en/en-a1-sentences.json` (new)

Generated with Claude Code
EOF
)"
```

4. **Code Review Checklist**

Reviewer should verify:
- [ ] All quality gates passed
- [ ] No merge conflicts
- [ ] Validation script output clean
- [ ] Sample testing in browser
- [ ] Documentation updated (if needed)

5. **Merge to Parent**
```bash
# Switch to parent branch
git checkout feature/universal-platform

# Merge with no-fast-forward (preserves history)
git merge --no-ff generation/en-a1 -m "Merge generation/en-a1: English A1 content complete"

# Push to remote
git push origin feature/universal-platform

# Delete merged branch (optional, recommended)
git branch -d generation/en-a1
git push origin --delete generation/en-a1
```

---

### Procedure 2: Parent → Main (Weekly)

**When:** End of each week (Friday)
**Who:** Project lead only
**Review:** Full team review + QA testing

#### Steps

1. **Pre-Merge Testing**
```bash
# Switch to parent
git checkout feature/universal-platform
git pull origin feature/universal-platform

# Full validation
./scripts/validate-branch.sh

# Integration testing
npm run dev
# Manual testing checklist (see GATE 2)
```

2. **Create Release PR**
```bash
gh pr create \
  --base main \
  --head feature/universal-platform \
  --title "feat: Universal Platform - Week X Release" \
  --body "$(cat <<'EOF'
## Week X Summary
- ✅ English A1-B2 complete (6,000 sentences)
- ✅ Spanish A1-A2 complete (3,000 sentences)
- ✅ Database schema updated
- ✅ All quality gates passed

## Branches Merged This Week
- generation/en-a1
- generation/en-a2
- generation/en-b1
- generation/en-b2
- generation/es-a1
- generation/es-a2
- generation/db-schema

## Testing
- [x] All automated tests pass
- [x] Manual QA complete
- [x] iOS build tested
- [x] Performance benchmarks met

## Deployment
Ready for production deployment

Generated with Claude Code
EOF
)"
```

3. **Team Review**
- [ ] At least 2 team members approve
- [ ] QA team sign-off
- [ ] No blocking issues

4. **Merge to Main**
```bash
# Switch to main
git checkout main
git pull origin main

# Merge parent branch
git merge --no-ff feature/universal-platform -m "Merge feature/universal-platform: Week X release"

# Tag release
git tag -a v4.0-week-1 -m "Universal Platform - Week 1 Release"

# Push to remote
git push origin main
git push origin v4.0-week-1
```

5. **Post-Merge**
```bash
# Verify production build
npm run build

# Deploy to Vercel
vercel --prod

# Update changelog
echo "## v4.0-week-1 (2025-11-XX)\n- Week 1 release notes" >> CHANGELOG.md
```

---

## Conflict Resolution

### Common Conflicts

#### 1. Sentence File Conflicts
**Cause:** Two branches modified same sentence file

**Resolution:**
```bash
# Accept both changes (merge sentences arrays)
git checkout --ours public/data/sentences/en/en-a1-sentences.json
git checkout --theirs public/data/sentences/en/en-a1-sentences.json

# Manually merge JSON files
node scripts/merge-sentence-files.js \
  public/data/sentences/en/en-a1-sentences.json \
  --ours path/to/ours.json \
  --theirs path/to/theirs.json
```

#### 2. Metadata Conflicts
**Cause:** Different quality scores or counts

**Resolution:**
```bash
# Recalculate metadata
node scripts/recalculate-metadata.js public/data/sentences/en/en-a1-sentences.json
```

#### 3. App.js Conflicts
**Cause:** Multiple features modifying src/app.js

**Resolution:**
- Review both changes carefully
- Keep both if compatible
- Test thoroughly after merge
- Use `git mergetool` for complex conflicts

---

## Rollback Procedures

### Emergency Rollback

If a merge introduces critical bugs:

#### Rollback Parent Branch
```bash
# Find last good commit
git log --oneline

# Reset to last good commit
git reset --hard <commit-hash>

# Force push (use with caution!)
git push origin feature/universal-platform --force-with-lease
```

#### Rollback Main Branch
```bash
# Create revert commit (safer than reset)
git revert <bad-commit-hash>

# Push revert
git push origin main
```

#### Re-deploy Previous Version
```bash
# Checkout previous tag
git checkout v4.0-week-1-previous

# Build and deploy
npm run build
vercel --prod
```

---

## Quality Metrics Tracking

### Weekly Report Template

```markdown
## Week X Quality Report (2025-11-XX)

### Branches Merged
| Branch | Sentences | Quality Score | Status |
|--------|-----------|---------------|--------|
| generation/en-a1 | 1,500 | 96/100 | ✅ Merged |
| generation/en-a2 | 1,500 | 95/100 | ✅ Merged |

### Validation Results
- ✅ JSON validation: PASSED
- ✅ Build test: PASSED
- ✅ Functional test: PASSED
- ✅ No duplicates: PASSED

### Issues Found
- None

### Next Week Goals
- Merge Spanish B1-B2
- Complete German A1-A2
```

---

## Checklist Summary

### Before Creating PR
- [ ] All validation scripts pass
- [ ] Build successful
- [ ] Manual testing complete
- [ ] No console errors
- [ ] Documentation updated
- [ ] Commit messages follow convention

### Before Merging PR
- [ ] Code review approved (≥2 reviewers)
- [ ] All discussions resolved
- [ ] CI/CD checks pass
- [ ] No merge conflicts
- [ ] Quality score ≥95%

### After Merging PR
- [ ] Delete merged branch (optional)
- [ ] Update project board
- [ ] Notify team in Slack/Discord
- [ ] Update CHANGELOG.md
- [ ] Tag release (if merging to main)

---

## Emergency Contacts

**Build Issues:** See `/docs/BUILD_TROUBLESHOOTING.md`
**Git Issues:** See `/docs/GIT_TROUBLESHOOTING.md`
**Content Issues:** See `/docs/CONTENT_GUIDELINES.md`

---

**Last Updated:** 2025-11-08
**Version:** 1.0
**Status:** Active
