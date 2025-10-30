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
COMPLETION_PATH="$HOME/.cts-completion.bash"

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

# Download and install bash completion
COMPLETION_URL="https://raw.githubusercontent.com/$REPO/$VERSION/cts-completion.bash"

echo "Installing bash completion..."

curl -fsSL "$COMPLETION_URL" -o "$COMPLETION_PATH"

if [ $? -ne 0 ]; then
  echo "Warning: Failed to download completion script. Continuing without completion support."
else
  # Source completion in bashrc if not already present
  if [ -f "$HOME/.bashrc" ]; then
    if ! grep -q "source.*cts-completion.bash" "$HOME/.bashrc"; then
      echo "" >> "$HOME/.bashrc"
      echo "# CTS bash completion" >> "$HOME/.bashrc"
      echo "source \"$COMPLETION_PATH\"" >> "$HOME/.bashrc"
      echo "Bash completion installed and added to ~/.bashrc"
    else
      echo "Bash completion script downloaded (already configured in ~/.bashrc)"
    fi
  elif [ -f "$HOME/.bash_profile" ]; then
    if ! grep -q "source.*cts-completion.bash" "$HOME/.bash_profile"; then
      echo "" >> "$HOME/.bash_profile"
      echo "# CTS bash completion" >> "$HOME/.bash_profile"
      echo "source \"$COMPLETION_PATH\"" >> "$HOME/.bash_profile"
      echo "Bash completion installed and added to ~/.bash_profile"
    else
      echo "Bash completion script downloaded (already configured in ~/.bash_profile)"
    fi
  else
    echo "Bash completion script downloaded to $COMPLETION_PATH"
    echo "Please add 'source \"$COMPLETION_PATH\"' to your shell configuration file"
  fi
fi

echo ""
echo "CTS installed successfully!"
echo "You can now run it using: cts"
echo ""
"$INSTALL_PATH" -v
echo ""
echo "Note: If completion doesn't work immediately, run: source ~/.bashrc"
echo "      Or restart your terminal."
