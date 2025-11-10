# Persian A1 Vocabulary Batch Generator

Automated script to generate remaining Persian A1 vocabulary batches (8-25) using Claude API.

## Prerequisites

1. **Python 3.7+** installed
2. **Anthropic API Key** - Get one from [console.anthropic.com](https://console.anthropic.com)
3. **Python packages:**
   ```bash
   pip install anthropic
   ```

## Setup

1. **Set your API key:**
   ```bash
   export ANTHROPIC_API_KEY='your-api-key-here'
   ```

   Or add to your shell profile (~/.bashrc, ~/.zshrc):
   ```bash
   echo 'export ANTHROPIC_API_KEY="your-api-key-here"' >> ~/.zshrc
   source ~/.zshrc
   ```

2. **Verify the script is executable:**
   ```bash
   chmod +x scripts/generate-remaining-batches.py
   ```

## Usage

### Run the script from project root:

```bash
./scripts/generate-remaining-batches.py
```

Or:

```bash
python3 scripts/generate-remaining-batches.py
```

## What the Script Does

1. **Reads prompts** from `prompts_batch2-25/fa_batch*.md`
2. **Uses batch 1** as reference format
3. **Calls Claude API** to generate vocabulary for each batch
4. **Validates JSON** with jq
5. **Commits each batch** to git with descriptive messages
6. **Pushes to remote** when complete

## Expected Output

```
======================================================================
Persian A1 Vocabulary Batch Generator
======================================================================
Generating batches 8 to 25

📖 Reading reference format from batch 1...
✅ Reference format loaded (20 words)

======================================================================
Processing Batch 8 (words 141-160)
======================================================================
🤖 Generating batch 8 with Claude...
✅ Saved: public/data/universal/fa-a1-batch8.json
✅ Valid JSON: fa-a1-batch8.json
✅ Committed batch 8

... (continues for batches 9-25)

======================================================================
SUMMARY
======================================================================
✅ Successful: 18 batches
   [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]
❌ Failed: 0 batches

Total words generated: 360
Total translations: 3240
Total examples: 9720
======================================================================

🚀 Pushing to remote...
✅ Successfully pushed to remote!
```

## Configuration

Edit the script to customize:

```python
BATCH_START = 8      # First batch to generate
BATCH_END = 25       # Last batch to generate
LANGUAGE_CODE = "fa" # Language code (fa = Persian)
```

## Troubleshooting

### API Key Error
```
❌ Error: ANTHROPIC_API_KEY environment variable not set
```
**Solution:** Set the API key as shown in Setup step 1

### JSON Validation Error
```
❌ Invalid JSON: fa-a1-batch8.json
```
**Solution:** The script will automatically retry. If persistent, check the generated JSON manually.

### Git Push Error
```
⚠️  Failed to push. You may need to push manually.
```
**Solution:** Push manually:
```bash
git push origin generation/fa-a1
```

## Cost Estimation

- **Model:** Claude Sonnet 4.5
- **Tokens per batch:** ~15,000 tokens (input + output)
- **Total batches:** 18 (batches 8-25)
- **Estimated cost:** ~$0.50-$1.00 USD

## Manual Review

After generation, review a few batches to ensure quality:

```bash
# View batch 8
jq '.[0]' public/data/universal/fa-a1-batch8.json

# Count words in batch 10
jq 'length' public/data/universal/fa-a1-batch10.json

# Check translations exist
jq '.[0].translations | keys' public/data/universal/fa-a1-batch15.json
```

## Next Steps

After successful generation:

1. **Review batches** - Spot-check a few batches for quality
2. **Create PR** - Create pull request on GitHub
3. **Merge** - Merge to main branch after review

## Support

For issues or questions, check:
- Script output for specific error messages
- Anthropic API status: [status.anthropic.com](https://status.anthropic.com)
- Project documentation
