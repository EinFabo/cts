#!/bin/bash

# CTS Test Runner
# Simple wrapper script to run all tests

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}CTS Test Runner${NC}"
echo "================"
echo

# Check if bats is installed
if ! command -v bats &> /dev/null; then
  echo -e "${RED}Error:${NC} bats is not installed."
  echo
  echo "Please install bats to run tests:"
  echo "  Ubuntu/Debian: sudo apt-get install bats"
  echo "  Arch Linux:    sudo pacman -S bats"
  echo "  macOS:         brew install bats-core"
  echo
  echo "Or install manually:"
  echo "  git clone https://github.com/bats-core/bats-core.git"
  echo "  cd bats-core"
  echo "  sudo ./install.sh /usr/local"
  exit 1
fi

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_DIR="$SCRIPT_DIR/tests"

# Check if test directory exists
if [ ! -d "$TEST_DIR" ]; then
  echo -e "${RED}Error:${NC} Test directory not found: $TEST_DIR"
  exit 1
fi

# Run tests
echo "Running tests..."
echo

cd "$TEST_DIR"

if bats *.bats; then
  echo
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo
  echo -e "${RED}Some tests failed.${NC}"
  exit 1
fi
