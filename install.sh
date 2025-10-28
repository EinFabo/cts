#!/bin/bash

# =======================================
# CTS Installer (Connect To Server)
# =======================================
# Usage:
#   bash install.sh [version]
#
# Examples:
#   bash install.sh v1.1       # installs specific version
#   bash install.sh            # installs latest version
# =======================================

REPO="EinFabo/cts"
VERSION="${1:-latest}"   # default to latest
INSTALL_PATH="$HOME/bin/cts"

echo "Installing CTS ($VERSION)..."

# Ensure bin directory exists
mkdir -p "$HOME/bin"

# Determine which version to fetch
if [ "$VERSION" = "latest" ]; then
  # Get the latest tag from GitHub API
  VERSION=$(curl -s "https://api.github.com/repos/$REPO/releases/latest" | grep -oP '"tag_name": "\K(.*)(?=")')
  if [ -z "$VERSION" ]; then
    echo "Error: Could not fetch latest version."
    exit 1
  fi
  echo "Latest version detected: $VERSION"
fi

# Download the CTS script from the tagged release
URL="https://raw.githubusercontent.com/$REPO/$VERSION/cts"

curl -fsSL "$URL" -o "$INSTALL_PATH"

if [ $? -ne 0 ]; then
  echo "Error: Failed to download CTS from $URL"
  exit 1
fi

chmod +x "$INSTALL_PATH"

echo "CTS installed successfully!"
echo "You can now run it using: cts"
echo
"$INSTALL_PATH" -v
