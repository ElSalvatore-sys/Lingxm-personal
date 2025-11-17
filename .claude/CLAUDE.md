
---
## 📚 Project Memory (Auto-Updated)

This project has automated memory management with data quality validation:

- **Main Memory:** `.claude/project-memory.md` (auto-updates on every commit)
- **Central Knowledge Base:** `.claude/knowledge-base/` (symlink to shared docs)
- **Data Validation:** Runs on every push, fails if schema violations found

**GitHub Action Features:**
- ✅ Auto-updates project memory
- ✅ Validates all 9 language files
- ✅ Generates data quality reports
- ✅ Weekly summaries
- ❌ Fails build if data quality issues detected
