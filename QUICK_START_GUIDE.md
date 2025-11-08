# LingXM Universal Platform - Quick Start Guide

## 🚀 For New Terminal Operators

This guide gets you started in 5 minutes. For full details, see:
- **Terminal assignments:** `TERMINAL_ASSIGNMENTS.md`
- **Quality gates:** `MERGE_CHECKLIST.md`
- **Full timeline:** `TIMELINE.md`

---

## Step 1: Choose Your Terminal Assignment

| Terminal | Branch | Content | Duration |
|----------|--------|---------|----------|
| **T1** | `generation/db-schema` | Database schema | Week 1 (7 days) |
| **T2** | `generation/en-a1` | English A1 (500 words) | Week 1 (5-7 days) |
| **T3** | `generation/en-a2` | English A2 (500 words) | Week 1 (5-7 days) |
| **T4** | `generation/en-b1` | English B1 (500 words) | Week 1 (5-7 days) |
| **T5** | `generation/en-b2` | English B2 (500 words) | Week 1 (5-7 days) |
| **T6** | `generation/es-a1` → `es-b1` | Spanish A1→B1 | Weeks 1-2 |
| **T7** | `generation/es-a2` → `es-b2` | Spanish A2→B2 | Weeks 1-2 |
| **T8** | `generation/de-a1-a2` | German A1-A2 (1,000 words) | Week 2 (7 days) |
| **T9** | `generation/fr-complete` | French completion | Week 2 (7 days) |
| **T10** | `generation/it-complete` | Italian completion | Week 2 (7 days) |
| **T11** | `feature/onboarding-flow` | Onboarding UI | Week 3 (7 days) |
| **T12** | `feature/profile-management` | Profile system | Week 3 (7 days) |
| **T13** | `generation/conjugations` | Conjugation validation | Week 3 (7 days) |

---

## Step 2: Clone & Setup (One-Time)

```bash
# Navigate to project directory
cd ~/Desktop/LingXM-Personal

# Fetch all branches
git fetch origin

# Verify all branches exist
git branch -r | grep generation
# Should show all 15+ branches

# Install dependencies (if not already done)
npm install

# Test build
npm run dev
# Should open http://localhost:5173
```

---

## Step 3: Switch to Your Branch

Replace `<your-branch>` with your assigned branch from Step 1:

```bash
# Checkout your assigned branch
git checkout <your-branch>

# Pull latest changes
git pull origin <your-branch>

# Verify you're on correct branch
git branch
# Should show * next to your branch
```

**Examples:**
```bash
# If you're T2 (English A1)
git checkout generation/en-a1

# If you're T6 (Spanish A1)
git checkout generation/es-a1

# If you're T11 (Onboarding)
git checkout feature/onboarding-flow
```

---

## Step 4: Daily Workflow

### Morning Routine
```bash
# Pull latest changes from your branch
git pull origin <your-branch>

# Pull parent branch updates
git fetch origin feature/universal-platform
git merge origin/feature/universal-platform

# Start development server
npm run dev
```

### During Work
Generate content following these rules:

**For Content Generation (T2-T10, T13):**
1. Use CEFR word lists (A1-C2) for your level
2. Generate 3 sentences per word
3. Each sentence must:
   - Contain the target word (exact match)
   - Have exactly 5 underscores: `_____`
   - Be grammatically correct
   - Be appropriate for the CEFR level

**Example Sentence:**
```json
{
  "id": "en-a1-hello-001",
  "sentence": "I always say _____ when I meet my friends.",
  "word": "hello",
  "level": "A1",
  "translation": "Siempre digo hola cuando veo a mis amigos."
}
```

### End of Day
```bash
# Check what you've changed
git status

# Add your changes
git add public/data/sentences/<language>/<file>.json
# OR for features:
git add src/

# Commit with descriptive message
git commit -m "feat(content): English A1 - 200 words completed (40%)"

# Push to your branch
git push origin <your-branch>
```

---

## Step 5: Quality Validation

Before creating a pull request, validate your work:

```bash
# Run validation script (if it exists)
./scripts/validate-branch.sh

# Manual checks:
# 1. Build test
npm run build
# Should complete without errors

# 2. Development test
npm run dev
# App should load and work correctly

# 3. Test your content
# - Open app in browser
# - Select your language/level
# - Verify sentences display correctly
# - Test sentence practice mode
```

### Quality Checklist
- [ ] All JSON files valid (no syntax errors)
- [ ] Quality score ≥ 95%
- [ ] All sentences have exactly 5 underscores
- [ ] Target word appears in each sentence
- [ ] No duplicate sentences
- [ ] No duplicate IDs
- [ ] Build successful
- [ ] App functional in browser

---

## Step 6: Create Pull Request

When your work is complete:

```bash
# Final push
git push origin <your-branch>

# Create PR using GitHub CLI
gh pr create \
  --base feature/universal-platform \
  --head <your-branch> \
  --title "feat(content): <Your Content Description>" \
  --body "## Summary
- Generated <X> words
- Created <Y> sentences
- Quality score: <Z>/100

## Validation
- [x] All quality gates passed
- [x] Build successful
- [x] Manual testing complete"
```

**OR create PR on GitHub:**
1. Go to https://github.com/ElSalvatore-sys/Lingxm-personal
2. Click "Pull requests" → "New pull request"
3. Base: `feature/universal-platform`
4. Compare: `<your-branch>`
5. Fill in title and description
6. Submit for review

---

## Step 7: After PR Merge

Once your PR is approved and merged:

```bash
# Switch to parent branch
git checkout feature/universal-platform

# Pull latest (includes your merged work)
git pull origin feature/universal-platform

# Delete your local branch (optional)
git branch -d <your-branch>

# Move to next assignment (if applicable)
git checkout <next-branch>
```

---

## Quick Commands Cheat Sheet

```bash
# See all available branches
git branch -a

# Switch branches
git checkout <branch-name>

# Check current branch
git branch

# See uncommitted changes
git status

# See commit history
git log --oneline

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard all local changes (DANGER!)
git reset --hard HEAD

# Create new branch (DON'T DO THIS - branches already created)
# git checkout -b <branch-name>

# Merge parent branch into your branch
git fetch origin feature/universal-platform
git merge origin/feature/universal-platform
```

---

## Common Issues & Solutions

### Issue 1: Merge Conflicts
```bash
# If you get merge conflicts:
git status
# Shows conflicted files

# Open conflicted files in editor
# Look for markers: <<<<<<<, =======, >>>>>>>
# Manually resolve conflicts

# After resolving:
git add <resolved-files>
git commit -m "chore: Resolve merge conflicts"
```

### Issue 2: Wrong Branch
```bash
# If you committed to wrong branch:
# 1. Note the commit hash
git log --oneline

# 2. Switch to correct branch
git checkout <correct-branch>

# 3. Cherry-pick the commit
git cherry-pick <commit-hash>

# 4. Go back and undo on wrong branch
git checkout <wrong-branch>
git reset --hard HEAD~1
```

### Issue 3: Need to Update Branch from Main
```bash
# Fetch latest from main
git fetch origin main

# Merge main into your branch
git merge origin/main

# Resolve any conflicts, then:
git push origin <your-branch>
```

### Issue 4: Accidentally Deleted Work
```bash
# Git keeps history! Find your lost commit:
git reflog

# Find the commit hash before deletion
# Restore it:
git cherry-pick <commit-hash>
```

---

## Content Generation Tips

### Finding CEFR Word Lists
- **English:** Search "CEFR English A1 word list"
- **Spanish:** Search "DELE A1 vocabulary list"
- **German:** Search "Goethe-Zertifikat A1 Wortliste"
- **French:** Search "DELF A1 vocabulaire"
- **Italian:** Search "CILS A1 lessico"

### Using Claude for Generation
Ask Claude Code:
```
Generate 10 English A1 sentences for the word "hello":
- Each sentence must contain the word "hello"
- Replace "hello" with exactly 5 underscores: _____
- Appropriate for A1 level (beginner)
- Natural and grammatically correct
- Return as JSON array
```

### Quality Validation
Test every 100 sentences:
1. Pick 10 random sentences
2. Verify target word present
3. Check blank format (5 underscores)
4. Read aloud - does it sound natural?
5. Check grammar with tool or AI

---

## Weekly Milestones

### Week 1 (Nov 8-14)
**Goal:** 9,000 sentences
- English A1-B2: 6,000 sentences
- Spanish A1-A2: 3,000 sentences
- Database schema ready

### Week 2 (Nov 15-21)
**Goal:** 6,000+ sentences
- Spanish B1-B2: 3,000 sentences
- German A1-A2: 3,000 sentences
- French/Italian gaps filled

### Week 3 (Nov 22-28)
**Goal:** Features complete
- Onboarding flow
- Profile management
- Conjugations validated

### Week 4 (Nov 29 - Dec 6)
**Goal:** Production launch
- QA testing
- Bug fixes
- Production deployment

---

## Communication

### Daily Standup (Post in Slack/Discord)
```
Terminal: T2
Branch: generation/en-a1
Progress: 300/500 words (60%)
Blockers: None
ETA: 2 days remaining
```

### When You Need Help
1. Check `TERMINAL_ASSIGNMENTS.md` for detailed instructions
2. Check `MERGE_CHECKLIST.md` for quality requirements
3. Ask in #lingxm-universal-platform channel
4. Tag project lead for urgent issues

---

## Success Metrics

Your work is successful when:
- ✅ Quality score ≥ 95%
- ✅ All sentences validated
- ✅ Build passes
- ✅ PR approved and merged
- ✅ No blockers for other terminals

---

## Emergency Contacts

**Project Lead:** [Name]
**Git Issues:** See `MERGE_CHECKLIST.md` → Rollback Procedures
**Content Questions:** See `TERMINAL_ASSIGNMENTS.md` → Content Specifications

---

## Full Documentation

For complete details, read:
1. **TERMINAL_ASSIGNMENTS.md** - Full terminal assignments, content specs, and commands
2. **MERGE_CHECKLIST.md** - Quality gates, validation, merge procedures
3. **TIMELINE.md** - 4-week timeline with daily schedules
4. **TTS_ANALYSIS.md** - TTS system documentation
5. **PHASE-*-TASK-*.md** - Previous phase documentation

---

## Git Branch Tree Visualization

```
main
 │
 └── feature/universal-platform (parent)
      │
      ├── Week 1 (Foundation)
      │    ├── generation/db-schema
      │    ├── generation/en-a1
      │    ├── generation/en-a2
      │    ├── generation/en-b1
      │    ├── generation/en-b2
      │    ├── generation/es-a1
      │    └── generation/es-a2
      │
      ├── Week 2 (Expansion)
      │    ├── generation/es-b1
      │    ├── generation/es-b2
      │    ├── generation/de-a1-a2
      │    ├── generation/fr-complete
      │    └── generation/it-complete
      │
      └── Week 3 (Features)
           ├── feature/onboarding-flow
           ├── feature/profile-management
           └── generation/conjugations
```

---

## Ready to Start?

1. Choose your terminal (Step 1)
2. Clone and setup (Step 2)
3. Switch to your branch (Step 3)
4. Start generating content! (Step 4)

**Questions?** Read the full docs or ask in the project channel.

**Let's build an amazing multilingual platform! 🚀**

---

**Last Updated:** 2025-11-08
**Version:** 1.0
**Status:** Active
