#!/bin/bash
# ============================================
# CTS - Connect To Server Installer
# ============================================
# Installs the CTS command for Termux or Linux systems.
# Usage:
#   curl -s https://raw.githubusercontent.com/EinFabo/cts/main/install.sh | bash
# ============================================

set -e

BIN_DIR="$HOME/bin"
CTS_PATH="$BIN_DIR/cts"
REPO_URL="https://raw.githubusercontent.com/EinFabo/cts/main/cts"

echo "Installing CTS (Connect To Server)..."

# Create bin directory if it doesn't exist
if [ ! -d "$BIN_DIR" ]; then
  echo "Creating $BIN_DIR..."
  mkdir -p "$BIN_DIR"
fi

# Download the CTS script
echo "Downloading cts script..."
curl -s -o "$CTS_PATH" "$REPO_URL"

# Make the script executable
chmod +x "$CTS_PATH"

# Ensure ~/bin is in PATH
if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
  echo "Adding $BIN_DIR to PATH..."
  {
    echo ""
    echo "# Added by CTS installer"
    echo "export PATH=\$PATH:$BIN_DIR"
  } >> "$HOME/.bashrc"

  if [ -f "$HOME/.profile" ]; then
    {
      echo ""
      echo "# Added by CTS installer"
      echo "export PATH=\$PATH:$BIN_DIR"
    } >> "$HOME/.profile"
  fi
fi

echo ""
echo "cts -help for help"
echo ""
