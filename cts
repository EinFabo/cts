#!/bin/bash
# =======================================
# CTS (Connect To Server)
# v1.4
# =======================================
# Usage:
#   cts <username> <alias>
#   cts <alias>
#   cts                      -> reconnect to last host
#   cts -a name=host         -> add alias
#   cts -a name=host:port    -> add alias with port
#   cts -rm name             -> remove alias
#   cts -rma                 -> remove all aliases (with confirmation)
#   cts -l                   -> list aliases (with tags)
#   cts -t name tag1,tag2    -> add tags to alias
#   cts -i name              -> show alias info
#   cts -rn oldname newname  -> rename alias
#   cts -export <file>       -> export aliases to file
#   cts -import <file>       -> import aliases from file
#   cts -help                -> show help
# =======================================

CONFIG_FILE="$HOME/.cts_hosts"
LAST_FILE="$HOME/.cts_last"
VERSION="v1.4"

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
  echo "  -a name=host:port        Add alias with custom port"
  echo "  -rm name                 Remove alias"
  echo "  -rma                     Remove all aliases (with confirmation)"
  echo "  -l                       List aliases (with tags)"
  echo "  -t name tag1,tag2       Add tags to alias"
  echo "  -i name                  Show alias information"
  echo "  -rn oldname newname      Rename alias"
  echo "  -export <file>           Export aliases to a file"
  echo "  -import <file>           Import aliases from a file"
  echo "  -v                       Show version"
  echo "  -help                    Show this help message"
}

# Extract host, port, and tags from alias entry
# Format: alias=host:port|tag1,tag2 or alias=host|tag1,tag2 or alias=host:port or alias=host
get_full_entry() {
  grep -E "^$1=" "$CONFIG_FILE" | cut -d'=' -f2
}

get_host() {
  local entry=$(get_full_entry "$1")
  # Remove tags if present (everything after |)
  entry="${entry%%|*}"
  # Extract host part (everything before :port)
  echo "${entry%%:*}"
}

get_port() {
  local entry=$(get_full_entry "$1")
  # Remove tags if present
  entry="${entry%%|*}"
  # Check if entry contains port
  if [[ "$entry" == *:* ]]; then
    echo "${entry##*:}"
  else
    echo ""
  fi
}

get_tags() {
  local entry=$(get_full_entry "$1")
  # Extract tags part (everything after |)
  if [[ "$entry" == *\|* ]]; then
    echo "${entry##*|}"
  else
    echo ""
  fi
}

# Save last connection: user host port
save_last() {
  echo "$1 $2 $3" > "$LAST_FILE"
}

# Load last connection: returns user host port
load_last() {
  if [ -f "$LAST_FILE" ]; then
    read -r user host port < "$LAST_FILE"
    echo "$user $host $port"
  else
    echo ""
  fi
}

remove_last_if_matches() {
  if [ -f "$LAST_FILE" ]; then
    read -r _ last_host _ < "$LAST_FILE"
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
    while IFS= read -r line; do
      if [ -z "$line" ]; then
        continue
      fi
      alias="${line%%=*}"
      entry="${line#*=}"
      host_port="${entry%%|*}"
      tags="${entry##*|}"
      
      if [[ "$tags" == "$entry" ]]; then
        tags=""
      fi
      
      if [[ "$host_port" == *:* ]]; then
        port="${host_port##*:}"
        host="${host_port%%:*}"
        if [ -n "$tags" ]; then
          echo "$alias → $host:$port | tags: $tags"
        else
          echo "$alias → $host:$port"
        fi
      else
        if [ -n "$tags" ]; then
          echo "$alias → $host_port | tags: $tags"
        else
          echo "$alias → $host_port"
        fi
      fi
    done < "$CONFIG_FILE"
    exit 0
    ;;
  -a)
    entry="${2}"
    name="${entry%%=*}"
    host_port="${entry#*=}"

    if [ -z "$name" ] || [ -z "$host_port" ]; then
      echo -e "${RED}Error:${NC} Invalid syntax. Use: cts -a name=host or cts -a name=host:port"
      exit 1
    fi

    if grep -qE "^$name=" "$CONFIG_FILE"; then
      echo -e "${RED}Error:${NC} Alias '$name' already exists."
      exit 1
    fi

    echo "$name=$host_port" >> "$CONFIG_FILE"
    echo -e "${GREEN}Added alias:${NC} $name → $host_port"
    ;;
  -t)
    if [ -z "$2" ]; then
      echo -e "${RED}Error:${NC} Invalid syntax. Use: cts -t name tag1,tag2"
      exit 1
    fi
    
    alias_name="$2"
    # Combine all remaining arguments as tags (in case user uses spaces: tag1, tag2, tag3)
    shift 2
    tags="$*"
    # Remove spaces after commas for consistent formatting
    tags=$(echo "$tags" | sed 's/, */,/g')
    
    if ! grep -qE "^$alias_name=" "$CONFIG_FILE"; then
      echo -e "${RED}Error:${NC} Alias '$alias_name' not found."
      exit 1
    fi
    
    # Get current entry
    current_entry=$(get_full_entry "$alias_name")
    host_port="${current_entry%%|*}"
    
    # Update entry with tags
    grep -vE "^$alias_name=" "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
    echo "$alias_name=$host_port|$tags" >> "$CONFIG_FILE"
    echo -e "${GREEN}Added tags to alias:${NC} $alias_name → tags: $tags"
    ;;
  -i)
    if [ -z "$2" ]; then
      echo -e "${RED}Error:${NC} Missing alias name."
      exit 1
    fi
    
    alias_name="$2"
    
    if ! grep -qE "^$alias_name=" "$CONFIG_FILE"; then
      echo -e "${RED}Error:${NC} Alias '$alias_name' not found."
      exit 1
    fi
    
    host=$(get_host "$alias_name")
    port=$(get_port "$alias_name")
    tags=$(get_tags "$alias_name")
    
    echo -e "${YELLOW}Alias Information:${NC}"
    echo "  Name: $alias_name"
    echo "  Host: $host"
    if [ -n "$port" ]; then
      echo "  Port: $port"
    else
      echo "  Port: 22 (default)"
    fi
    if [ -n "$tags" ]; then
      echo "  Tags: $tags"
    else
      echo "  Tags: (none)"
    fi
    exit 0
    ;;
  -rn)
    if [ -z "$2" ] || [ -z "$3" ]; then
      echo -e "${RED}Error:${NC} Invalid syntax. Use: cts -rn oldname newname"
      exit 1
    fi
    
    old_name="$2"
    new_name="$3"
    
    if ! grep -qE "^$old_name=" "$CONFIG_FILE"; then
      echo -e "${RED}Error:${NC} Alias '$old_name' not found."
      exit 1
    fi
    
    if grep -qE "^$new_name=" "$CONFIG_FILE"; then
      echo -e "${RED}Error:${NC} Alias '$new_name' already exists."
      exit 1
    fi
    
    # Get the entry
    entry=$(get_full_entry "$old_name")
    
    # Update config file
    grep -vE "^$old_name=" "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
    echo "$new_name=$entry" >> "$CONFIG_FILE"
    
    # Get host from old alias for potential history update
    old_host=$(get_host "$old_name")
    
    # Update last connection if host matches (to ensure reconnect works with new name)
    if [ -f "$LAST_FILE" ]; then
      read -r user saved_host port < "$LAST_FILE"
      if [ "$old_host" = "$saved_host" ]; then
        # Host matches - save_last will be called on next connection anyway
        # But we update it here to ensure consistency
        save_last "$user" "$saved_host" "$port"
      fi
    fi
    
    echo -e "${GREEN}Renamed alias:${NC} $old_name → $new_name"
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
    imported_count=0
    while IFS= read -r line; do
      if [ -z "$line" ]; then
        continue
      fi
      alias="${line%%=*}"
      entry="${line#*=}"
      if ! grep -qE "^$alias=" "$CONFIG_FILE"; then
        echo "$alias=$entry" >> "$CONFIG_FILE"
        imported_count=$((imported_count + 1))
      fi
    done < "$file"
    echo -e "${GREEN}Imported $imported_count alias(es) from:${NC} $file"
    ;;
  "")
    last=$(load_last)
    if [ -z "$last" ]; then
      echo -e "${YELLOW}No previous connection found.${NC}"
      echo "Use 'cts <user> <alias>' to connect first."
      echo "Run 'cts -help' for more information."
      exit 0
    fi
    read -r user host port <<< "$last"
    if [ -n "$port" ]; then
      echo -e "${GREEN}Reconnecting to last host:${NC} $user@$host:$port"
      exec ssh -p "$port" "${user}@${host}"
    else
      echo -e "${GREEN}Reconnecting to last host:${NC} $user@$host"
      exec ssh "${user}@${host}"
    fi
    ;;
  *)
    if [ $# -eq 1 ]; then
      alias="$1"
      user_host_port=$(load_last)
      if [ -z "$user_host_port" ]; then
        echo -e "${RED}Error:${NC} No saved user found. Connect once using 'cts <user> <alias>'."
        echo "Run 'cts -help' for more information."
        exit 1
      fi
      read -r user _ _ <<< "$user_host_port"
      host=$(get_host "$alias")
      if [ -z "$host" ]; then
        echo -e "${RED}Error:${NC} Alias '$alias' not found."
        exit 1
      fi
      port=$(get_port "$alias")
      if [ -n "$port" ]; then
        echo -e "${GREEN}Connecting:${NC} $user@$host:$port"
        save_last "$user" "$host" "$port"
        exec ssh -p "$port" "${user}@${host}"
      else
        echo -e "${GREEN}Connecting:${NC} $user@$host"
        save_last "$user" "$host" ""
        exec ssh "${user}@${host}"
      fi
    elif [ $# -eq 2 ]; then
      user="$1"
      alias="$2"
      host=$(get_host "$alias")
      if [ -z "$host" ]; then
        echo -e "${RED}Error:${NC} Alias '$alias' not found."
        exit 1
      fi
      port=$(get_port "$alias")
      if [ -n "$port" ]; then
        echo -e "${GREEN}Connecting:${NC} $user@$host:$port"
        save_last "$user" "$host" "$port"
        exec ssh -p "$port" "${user}@${host}"
      else
        echo -e "${GREEN}Connecting:${NC} $user@$host"
        save_last "$user" "$host" ""
        exec ssh "${user}@${host}"
      fi
    else
      show_help
      exit 1
    fi
    ;;
esac
