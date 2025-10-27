#!/bin/bash
# ============================================
# CTS - Connect To Server
# ============================================
# A simple tool for managing SSH connections
# with user-defined host shortcuts.
#
# Usage:
#   cts <username> <hostname>
#   cts . <shortcut>=<IP or hostname>
# ============================================

CONFIG_FILE="$HOME/.cts_hosts"

# Ensure configuration file exists
if [ ! -f "$CONFIG_FILE" ]; then
  touch "$CONFIG_FILE"
fi

# Add a new shortcut
if [ "$1" = "." ]; then
  if [ -z "$2" ]; then
    echo "Usage: cts . <shortcut>=<IP or hostname>"
    exit 1
  fi

  if ! echo "$2" | grep -q "="; then
    echo "Invalid format. Use: <shortcut>=<IP or hostname>"
    exit 1
  fi

  # If shortcut already exists, replace it
  shortcut_name=$(echo "$2" | cut -d '=' -f1)
  grep -v "^${shortcut_name}=" "$CONFIG_FILE" > "${CONFIG_FILE}.tmp" && mv "${CONFIG_FILE}.tmp" "$CONFIG_FILE"

  echo "$2" >> "$CONFIG_FILE"
  echo "Shortcut added: $2"
  exit 0
fi

# Verify argument count.
if [ "$#" -ne 2 ]; then
  echo "Usage:"
  echo "  cts <username> <hostname>"
  echo ""
  echo "Add a shortcut:"
  echo "  cts . MyServer=192.168.1.60"
  echo ""
  echo "Connect using a shortcut:"
  echo "  cts admin MyServer"
  exit 1
fi

username="$1"
hostname="$2"

# Replace shortcut with actual host if defined
if grep -q "^${hostname}=" "$CONFIG_FILE"; then
  hostname=$(grep "^${hostname}=" "$CONFIG_FILE" | tail -n 1 | cut -d '=' -f2)
fi

# Execute SSH connection
exec ssh "${username}@${hostname}"
