#!/bin/bash

# Validation script for cache-busting implementation
# Run this to verify all components are properly set up

echo "=== Cache-Busting Implementation Validation ==="
echo

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Helper functions
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} File exists: $1"
    else
        echo -e "${RED}✗${NC} File missing: $1"
        ((ERRORS++))
    fi
}

check_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Found: $2"
    else
        echo -e "${RED}✗${NC} Missing: $2 in $1"
        ((ERRORS++))
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} Directory exists: $1"
    else
        echo -e "${YELLOW}⚠${NC} Directory missing: $1"
        ((WARNINGS++))
    fi
}

echo "1. Checking Created Files"
echo "========================="
check_file "/Users/eldiaploo/Desktop/LingXM-Personal/src/utils/version-check.js"
check_file "/Users/eldiaploo/Desktop/LingXM-Personal/CACHE_BUSTING_IMPLEMENTATION.md"
check_file "/Users/eldiaploo/Desktop/LingXM-Personal/DEPLOYMENT_GUIDE.md"
check_file "/Users/eldiaploo/Desktop/LingXM-Personal/PRE_DEPLOY_CHECKLIST.md"
check_file "/Users/eldiaploo/Desktop/LingXM-Personal/CACHE_BUSTING_SUMMARY.md"
check_file "/Users/eldiaploo/Desktop/LingXM-Personal/build-version.js"
echo

echo "2. Checking Modified Files"
echo "=========================="
check_file "/Users/eldiaploo/Desktop/LingXM-Personal/index.html"
check_file "/Users/eldiaploo/Desktop/LingXM-Personal/vite.config.js"
check_file "/Users/eldiaploo/Desktop/LingXM-Personal/public/service-worker.js"
check_file "/Users/eldiaploo/Desktop/LingXM-Personal/src/app.js"
echo

echo "3. Checking Content in index.html"
echo "=================================="
check_content "/Users/eldiaploo/Desktop/LingXM-Personal/index.html" "cache-control"
check_content "/Users/eldiaploo/Desktop/LingXM-Personal/index.html" "Bootstrap"
check_content "/Users/eldiaploo/Desktop/LingXM-Personal/index.html" "build-timestamp"
check_content "/Users/eldiaploo/Desktop/LingXM-Personal/index.html" "version.json"
echo

echo "4. Checking Content in vite.config.js"
echo "====================================="
check_content "/Users/eldiaploo/Desktop/LingXM-Personal/vite.config.js" "version"
check_content "/Users/eldiaploo/Desktop/LingXM-Personal/vite.config.js" "buildTimestamp"
check_content "/Users/eldiaploo/Desktop/LingXM-Personal/vite.config.js" "build-version"
echo

echo "5. Checking Content in service-worker.js"
echo "========================================"
check_content "/Users/eldiaploo/Desktop/LingXM-Personal/public/service-worker.js" "network-first"
check_content "/Users/eldiaploo/Desktop/LingXM-Personal/public/service-worker.js" "version.json"
check_content "/Users/eldiaploo/Desktop/LingXM-Personal/public/service-worker.js" "Cache-Control"
echo

echo "6. Checking Content in app.js"
echo "============================="
check_content "/Users/eldiaploo/Desktop/LingXM-Personal/src/app.js" "version-check"
check_content "/Users/eldiaploo/Desktop/LingXM-Personal/src/app.js" "initVersionCheck"
echo

echo "7. Checking version-check.js Content"
echo "===================================="
check_content "/Users/eldiaploo/Desktop/LingXM-Personal/src/utils/version-check.js" "VersionCheck"
check_content "/Users/eldiaploo/Desktop/LingXM-Personal/src/utils/version-check.js" "fetchLatestVersion"
check_content "/Users/eldiaploo/Desktop/LingXM-Personal/src/utils/version-check.js" "handleVersionMismatch"
echo

echo "8. Checking Git Status"
echo "====================="
cd /Users/eldiaploo/Desktop/LingXM-Personal
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" = "main" ]; then
    echo -e "${GREEN}✓${NC} On main branch"
else
    echo -e "${YELLOW}⚠${NC} Not on main branch: $BRANCH"
    ((WARNINGS++))
fi

STATUS=$(git status --porcelain)
if [ -z "$STATUS" ]; then
    echo -e "${GREEN}✓${NC} Working tree is clean"
else
    echo -e "${YELLOW}⚠${NC} Working tree has changes"
    ((WARNINGS++))
fi
echo

echo "9. Checking Dependencies"
echo "======================="
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓${NC} Node.js installed"
else
    echo -e "${RED}✗${NC} Node.js not found"
    ((ERRORS++))
fi

if [ -d "/Users/eldiaploo/Desktop/LingXM-Personal/node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules exists"
else
    echo -e "${YELLOW}⚠${NC} node_modules not found - run: npm install"
    ((WARNINGS++))
fi

if [ -f "/Users/eldiaploo/Desktop/LingXM-Personal/package.json" ]; then
    echo -e "${GREEN}✓${NC} package.json exists"
else
    echo -e "${RED}✗${NC} package.json not found"
    ((ERRORS++))
fi
echo

echo "10. Pre-Build Validation"
echo "======================="
echo "Run 'npm run build' to validate build process"
echo

echo "=== Validation Summary ==="
echo -e "Errors: ${RED}${ERRORS}${NC}"
echo -e "Warnings: ${YELLOW}${WARNINGS}${NC}"
echo

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
    echo
    echo "Next steps:"
    echo "1. Review: CACHE_BUSTING_SUMMARY.md"
    echo "2. Build: npm run build"
    echo "3. Test: npm run preview"
    echo "4. Deploy: npm run deploy"
    echo "5. Verify: See DEPLOYMENT_GUIDE.md"
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Fix errors before proceeding.${NC}"
    exit 1
fi
