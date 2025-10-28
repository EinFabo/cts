#!/bin/bash
# =======================================
# CTS (Connect To Server)
# v1.3.1
# =======================================
# Usage:
#   cts <username> <alias>
#   cts <alias>
#   cts                      -> reconnect to last host
#   cts -a name=host         -> add alias
#   cts -rm name             -> remove alias
#   cts -rma                 -> remove all aliases (with confirmation)
#   cts -l                   -> list aliases
#   cts -export <file>       -> export aliases to file
#   cts -import <file>       -> import aliases from file
#   cts -help                -> show help
# =======================================

CONFIG_FILE="$HOME/.cts_hosts"
LAST_FILE="$HOME/.cts_last"
VERSION="v1.3"

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

mkdir -p "$(dirname "$CONFIG_FILE")"
touch "$CONFIG_FILE"

# --- Helper functions ---
show_help() {
  echo -e "${YELLOW}CTS (Connect To Server) $VERSION${NC}"
  echo "Usage:"
  echo "  cts <user> <alias>       Connect using alias"
  echo "  cts <alias>              Connect using saved user"
  echo "  cts                      Reconnect to last used host"
  echo
  echo "Options:"
  echo "  -a name=host             Add alias"
  echo "  -rm name                 Remove alias"
  echo "  -rma                     Remove all aliases (with confirmation)"
  echo "  -l                       List aliases"
  echo "  -export <file>           Export aliases to a file"
  echo "  -import <file>           Import aliases from a file"
  echo "  -v                       Show version"
  echo "  -help                    Show this help message"
}

get_host() {
  grep -E "^$1=" "$CONFIG_FILE" | cut -d'=' -f2
}

save_last() {
  echo "$1 $2" > "$LAST_FILE"
}

load_last() {
  if [ -f "$LAST_FILE" ]; then
    read -r user host < "$LAST_FILE"
    echo "$user $host"
  else
    echo ""
  fi
}

remove_last_if_matches() {
  if [ -f "$LAST_FILE" ]; then
    read -r _ last_host < "$LAST_FILE"
    if [ "$1" = "$last_host" ]; then
      rm -f "$LAST_FILE"
    fi
  fi
}

# --- Main logic ---
case "$1" in
  -help)
    show_help
    exit 0
    ;;
  -v)
    echo "CTS version $VERSION"
    exit 0
    ;;
  -l)
    echo -e "${YELLOW}Saved aliases:${NC}"
    if [ ! -s "$CONFIG_FILE" ]; then
      echo "(none)"
      exit 0
    fi
    cat "$CONFIG_FILE"
    exit 0
    ;;
  -a)
    entry="${2}"
    name="${entry%%=*}"
    host="${entry#*=}"

    if [ -z "$name" ] || [ -z "$host" ]; then
      echo -e "${RED}Error:${NC} Invalid syntax. Use: cts -a name=host"
      exit 1
    fi

    if grep -qE "^$name=" "$CONFIG_FILE"; then
      echo -e "${RED}Error:${NC} Alias '$name' already exists."
      exit 1
    fi

    echo "$name=$host" >> "$CONFIG_FILE"
    echo -e "${GREEN}Added alias:${NC} $name → $host"
    ;;
  -rm)
    if [ -z "$2" ]; then
      echo -e "${RED}Error:${NC} Missing alias name."
      exit 1
    fi
    if grep -qE "^$2=" "$CONFIG_FILE"; then
      host_to_remove=$(get_host "$2")
      grep -vE "^$2=" "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
      remove_last_if_matches "$host_to_remove"
      echo -e "${GREEN}Removed alias:${NC} $2"
    else
      echo -e "${RED}Error:${NC} Alias '$2' not found."
    fi
    ;;
  -rma)
    echo -e "${YELLOW}This will delete all aliases and last connection data.${NC}"
    read -rp "Are you sure? [y/N]: " confirm
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
      rm -f "$CONFIG_FILE" "$LAST_FILE"
      touch "$CONFIG_FILE"
      echo -e "${GREEN}All aliases and saved connections deleted.${NC}"
    else
      echo "Aborted."
    fi
    ;;
  -export)
    file="$2"
    if [ -z "$file" ]; then
      echo -e "${RED}Error:${NC} Missing export file path."
      exit 1
    fi
    cp "$CONFIG_FILE" "$file" && echo -e "${GREEN}Exported aliases to:${NC} $file"
    ;;
  -import)
    file="$2"
    if [ -z "$file" ]; then
      echo -e "${RED}Error:${NC} Missing import file path."
      exit 1
    fi
    if [ ! -f "$file" ]; then
      echo -e "${RED}Error:${NC} File not found: $file"
      exit 1
    fi
    while IFS= read -r line; do
      alias="${line%%=*}"
      host="${line#*=}"
      if ! grep -qE "^$alias=" "$CONFIG_FILE"; then
        echo "$alias=$host" >> "$CONFIG_FILE"
      fi
    done < "$file"
    echo -e "${GREEN}Imported aliases from:${NC} $file"
    ;;
  "")
    last=$(load_last)
    if [ -z "$last" ]; then
      echo -e "${YELLOW}No previous connection found.${NC}"
      echo "Use 'cts <user> <alias>' to connect first."
      echo "Run 'cts -help' for more information."
      exit 0
    fi
    read -r user host <<< "$last"
    echo -e "${GREEN}Reconnecting to last host:${NC} $user@$host"
    exec ssh "${user}@${host}"
    ;;
  *)
    if [ $# -eq 1 ]; then
      alias="$1"
      user_host=$(load_last)
      if [ -z "$user_host" ]; then
        echo -e "${RED}Error:${NC} No saved user found. Connect once using 'cts <user> <alias>'."
        echo "Run 'cts -help' for more information."
        exit 1
      fi
      read -r user _ <<< "$user_host"
      host=$(get_host "$alias")
      if [ -z "$host" ]; then
        echo -e "${RED}Error:${NC} Alias '$alias' not found."
        exit 1
      fi
      echo -e "${GREEN}Connecting:${NC} $user@$host"
      save_last "$user" "$host"
      exec ssh "${user}@${host}"
    elif [ $# -eq 2 ]; then
      user="$1"
      alias="$2"
      host=$(get_host "$alias")
      if [ -z "$host" ]; then
        echo -e "${RED}Error:${NC} Alias '$alias' not found."
        exit 1
      fi
      echo -e "${GREEN}Connecting:${NC} $user@$host"
      save_last "$user" "$host"
      exec ssh "${user}@${host}"
    else
      show_help
      exit 1
    fi
    ;;
esac
