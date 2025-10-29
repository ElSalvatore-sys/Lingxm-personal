#!/bin/bash
# Icon Generation Script for LingXM Personal PWA
#
# This script converts the SVG logo to PNG icons in various sizes
#
# Prerequisites:
#   1. Install ImageMagick: brew install imagemagick
#   2. Make this script executable: chmod +x scripts/generate-icons.sh
#
# Usage:
#   ./scripts/generate-icons.sh
#
# Alternative: Use an online SVG to PNG converter:
#   - https://cloudconvert.com/svg-to-png
#   - https://svgtopng.com/
#   - Upload public/logo.svg and download each size

echo "🎨 Generating PWA icons from logo.svg..."

# Check if ImageMagick is installed
if ! command -v magick &> /dev/null; then
    echo "❌ ImageMagick not found!"
    echo ""
    echo "Install it with: brew install imagemagick"
    echo ""
    echo "Or use an online converter:"
    echo "  1. Go to https://cloudconvert.com/svg-to-png"
    echo "  2. Upload public/logo.svg"
    echo "  3. Download each size: 72, 96, 128, 144, 152, 192, 384, 512"
    echo "  4. Save to public/icons/"
    exit 1
fi

# Source SVG
SVG="public/logo.svg"
OUTPUT_DIR="public/icons"

# Icon sizes
SIZES=(72 96 128 144 152 192 384 512)

# Generate each size
for SIZE in "${SIZES[@]}"; do
    echo "  ➜ Generating ${SIZE}x${SIZE}..."
    magick "$SVG" -resize "${SIZE}x${SIZE}" "$OUTPUT_DIR/icon-${SIZE}x${SIZE}.png"
done

echo "✅ All icons generated successfully!"
echo ""
echo "📁 Icons saved to: $OUTPUT_DIR"
ls -lh "$OUTPUT_DIR"
