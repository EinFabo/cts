#!/bin/bash
# =====================================================
#  CTS v1.1 - Connect To Server
#  by EinFabo
#  https://github.com/EinFabo/cts
# =====================================================

VERSION="v1.1"
CONFIG_FILE="$HOME/.cts_hosts"

# === Colors ===
GREEN="\033[1;32m"
RED="\033[1;31m"
YELLOW="\033[1;33m"
RESET="\033[0m"

# === Initialize config file if missing ===
if [ ! -f "$CONFIG_FILE" ]; then
  touch "$CONFIG_FILE"
fi

# === Helper Functions ===
print_help() {
  echo -e "${YELLOW}CTS - Connect To Server${RESET}"
  echo ""
  echo "Usage:"
  echo "  cts <alias>                Connect using saved alias"
  echo "  cts <user> <alias>         Connect and remember user for alias"
  echo ""
  echo "Options:"
  echo "  -a <alias>=<host>          Add a new alias"
  echo "  -r <old>=<new>             Rename an alias"
  echo "  -rm <alias>                Remove an alias"
  echo "  -l                         List all aliases"
  echo "  -v                         Show version info"
  echo "  -help                      Show this help message"
  echo ""
}

print_version() {
  echo -e "${YELLOW}CTS ${VERSION}${RESET}"
  echo "by EinFabo"
  echo "https://github.com/EinFabo/cts"
}

list_aliases() {
  echo -e "${YELLOW}Saved aliases:${RESET}"
  if [ ! -s "$CONFIG_FILE" ]; then
    echo "  (none)"
  else
    awk -F= '{printf "  %-15s -> %-20s (user: %s)\n", $1, $2, $3 ? $3 : "none"}' "$CONFIG_FILE"
  fi
}

# === Core Logic ===
if [[ "$1" == "-help" ]]; then
  print_help
  exit 0
fi

if [[ "$1" == "-v" ]]; then
  print_version
  exit 0
fi

if [[ "$1" == "-l" ]]; then
  list_aliases
  exit 0
fi

if [[ "$1" == "-a" ]]; then
  pair="${2}"
  alias_name="${pair%%=*}"
  host="${pair#*=}"

  if grep -q "^${alias_name}=" "$CONFIG_FILE"; then
    echo -e "${RED}Alias '${alias_name}' already exists. Use -r to rename or -rm to remove.${RESET}"
    exit 1
  fi

  echo "${alias_name}=${host}" >> "$CONFIG_FILE"
  echo -e "${GREEN}Added alias:${RESET} ${alias_name} -> ${host}"
  exit 0
fi

if [[ "$1" == "-r" ]]; then
  old="${2%%=*}"
  new="${2#*=}"

  if ! grep -q "^${old}=" "$CONFIG_FILE"; then
    echo -e "${RED}Alias '${old}' not found.${RESET}"
    exit 1
  fi

  if grep -q "^${new}=" "$CONFIG_FILE"; then
    echo -e "${RED}Alias '${new}' already exists.${RESET}"
    exit 1
  fi

  sed -i "s/^${old}=/${new}=/" "$CONFIG_FILE"
  echo -e "${GREEN}Renamed alias:${RESET} ${old} -> ${new}"
  exit 0
fi

if [[ "$1" == "-rm" ]]; then
  alias_name="$2"
  if grep -q "^${alias_name}=" "$CONFIG_FILE"; then
    sed -i "/^${alias_name}=/d" "$CONFIG_FILE"
    echo -e "${GREEN}Removed alias:${RESET} ${alias_name}"
  else
    echo -e "${RED}Alias '${alias_name}' not found.${RESET}"
  fi
  exit 0
fi

# === Connection Handling ===
if [[ $# -eq 1 ]]; then
  alias_name="$1"

  line=$(grep "^${alias_name}=" "$CONFIG_FILE")
  if [ -z "$line" ]; then
    echo -e "${RED}Alias '${alias_name}' not found.${RESET}"
    exit 1
  fi

  host=$(echo "$line" | cut -d= -f2)
  user=$(echo "$line" | cut -d= -f3)

  if [ -z "$user" ]; then
    echo -e "${YELLOW}No saved user for '${alias_name}'. Please specify one first.${RESET}"
    exit 1
  fi

  echo -e "${GREEN}Connecting to ${user}@${host}...${RESET}"
  exec ssh "${user}@${host}"
  exit 0
fi

if [[ $# -eq 2 ]]; then
  user="$1"
  alias_name="$2"

  line=$(grep "^${alias_name}=" "$CONFIG_FILE")
  if [ -z "$line" ]; then
    echo -e "${RED}Alias '${alias_name}' not found.${RESET}"
    exit 1
  fi

  host=$(echo "$line" | cut -d= -f2)
  sed -i "/^${alias_name}=/d" "$CONFIG_FILE"
  echo "${alias_name}=${host}=${user}" >> "$CONFIG_FILE"

  echo -e "${GREEN}Saved user '${user}' for alias '${alias_name}'.${RESET}"
  echo -e "${GREEN}Connecting to ${user}@${host}...${RESET}"
  exec ssh "${user}@${host}"
  exit 0
fi

# === Default: Show Help ===
print_help
exit 0
