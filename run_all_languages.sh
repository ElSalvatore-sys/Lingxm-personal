#!/bin/bash

# ============================================================================
# LingXM Parallel Vocabulary Generation
# Runs vocabulary generation for all languages simultaneously
# ============================================================================

set -e

PROJECT_DIR="/Users/eldiaploo/Desktop/Projects-2025/LingXM-Personal"
LANGUAGES=( en de es ar fr it ru pl fa )

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🌍 LingXM Parallel Vocabulary Generation"
echo "=========================================="
echo ""

# Navigate to project directory
cd "$PROJECT_DIR"

# Activate virtual environment
if [ -d ".venv" ]; then
    source .venv/bin/activate
    echo -e "${GREEN}✓ Python venv activated${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: .venv not found${NC}"
fi

# Create logs directory
mkdir -p logs

# Clear old logs
rm -f logs/*.log

echo ""
echo "Languages to process: ${LANGUAGES[*]}"
echo "Processing in parallel..."
echo ""

# Track PIDs
PIDS=()
START_TIME=$(date +%s)

# Launch all language processes in parallel
for lang in "${LANGUAGES[@]}"; do
    echo -e "${BLUE}▶ Starting: $lang${NC}"
    python3 run_parallel.py "$lang" > "logs/${lang}.log" 2>&1 &
    PIDS+=($!)
done

echo ""
echo "All processes launched. Waiting for completion..."
echo ""

# Monitor progress
COMPLETED=0
TOTAL=${#LANGUAGES[@]}

while [ $COMPLETED -lt $TOTAL ]; do
    COMPLETED=0
    for i in "${!PIDS[@]}"; do
        pid=${PIDS[$i]}
        lang=${LANGUAGES[$i]}

        # Check if process is still running
        if ! kill -0 $pid 2>/dev/null; then
            # Process completed
            ((COMPLETED++))

            # Check exit status
            wait $pid
            EXIT_CODE=$?

            if [ $EXIT_CODE -eq 0 ]; then
                echo -e "${GREEN}✓ Completed: $lang${NC}"
            else
                echo -e "${YELLOW}⚠️  Warning: $lang exited with code $EXIT_CODE${NC}"
            fi
        fi
    done

    # Show progress
    echo -ne "\rProgress: $COMPLETED/$TOTAL languages complete"

    # Don't spam the output
    sleep 2
done

echo ""
echo ""

# Calculate duration
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo "=========================================="
echo -e "${GREEN}✅ All Languages Processed!${NC}"
echo "=========================================="
echo ""
echo "Total time: ${MINUTES}m ${SECONDS}s"
echo ""
echo "Logs saved to:"
for lang in "${LANGUAGES[@]}"; do
    if [ -f "logs/${lang}.log" ]; then
        LOG_SIZE=$(du -h "logs/${lang}.log" | cut -f1)
        echo "  - logs/${lang}.log ($LOG_SIZE)"
    fi
done

echo ""
echo "To view detailed logs:"
echo "  tail -f logs/<language>.log"
echo ""
echo "To check for errors:"
echo "  grep -i error logs/*.log"
echo ""
