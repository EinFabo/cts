#!/bin/bash
# =======================================
# CTS (Connect To Server)
# v1.4.1
# =======================================
# Usage:
#   cts <username> <alias>
#   cts <alias>
#   cts <alias> -nd          -> use last user instead of default
#   cts                      -> reconnect to last host
#   cts -a name=host         -> add alias
#   cts -a name=host:port    -> add alias with port
#   cts -rm name             -> remove alias
#   cts -rma                 -> remove all aliases (with confirmation)
#   cts -l                   -> list aliases (with tags)
#   cts -l -t tag            -> list aliases filtered by tag
#   cts -t name tag1,tag2    -> replace all tags
#   cts -ta name tag1,tag2   -> add tags to alias
#   cts -trm name tag1       -> remove specific tag(s)
#   cts -tc name             -> clear all tags
#   cts -i name              -> show alias info
#   cts -rn oldname newname  -> rename alias
#   cts -du alias username   -> set default user for alias
#   cts -export <file>       -> export aliases to file
#   cts -import <file>       -> import aliases from file
#   cts -uc                  -> check for updates
#   cts -help                -> show help
# =======================================

CONFIG_FILE="$HOME/.cts_hosts"
LAST_FILE="$HOME/.cts_last"
DEFAULT_USERS_FILE="$HOME/.cts_default_users"
VERSION="v1.4.1"

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

mkdir -p "$(dirname "$CONFIG_FILE")"
touch "$CONFIG_FILE"
touch "$DEFAULT_USERS_FILE"

# --- Helper functions ---
show_help() {
  echo -e "${YELLOW}CTS (Connect To Server) $VERSION${NC}"
  echo "Usage:"
  echo "  cts <user> <alias>       Connect using alias with specified user"
  echo "  cts <alias>              Connect using default user or last used user"
  echo "  cts <alias> -nd          Connect using last used user (ignore default)"
  echo "  cts                      Reconnect to last used host"
  echo
  echo "Alias Management:"
  echo "  -a name=host             Add alias"
  echo "  -a name=host:port        Add alias with custom port"
  echo "  -rm name                 Remove alias"
  echo "  -rma                     Remove all aliases (with confirmation)"
  echo "  -rn oldname newname      Rename alias"
  echo "  -l                       List aliases (with tags)"
  echo "  -l -t tag               List aliases filtered by tag"
  echo "  -i name                  Show alias information"
  echo
  echo "Tag Management:"
  echo "  -t name tag1,tag2       Replace all tags"
  echo "  -ta name tag1,tag2      Add tags to alias"
  echo "  -trm name tag1          Remove specific tag(s)"
  echo "  -tc name                Clear all tags"
  echo
  echo "User Management:"
  echo "  -du alias username       Set default user for alias"
  echo
  echo "Import/Export:"
  echo "  -export <file>           Export aliases to a file"
  echo "  -import <file>           Import aliases from a file"
  echo
  echo "Other:"
  echo "  -v                       Show version"
  echo "  -uc                      Check for updates"
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

# Get alias-specific last user file path
get_alias_last_file() {
  echo "$HOME/.cts_last_$1"
}

# Save last connection per alias: user host port
save_last() {
  echo "$1 $2 $3" > "$LAST_FILE"
}

# Save last connection for specific alias: user port
save_alias_last() {
  local alias_name="$1"
  local user="$2"
  local port="$3"
  local alias_last_file=$(get_alias_last_file "$alias_name")
  echo "$user $port" > "$alias_last_file"
}

# Load last connection: returns user host port (global)
load_last() {
  if [ -f "$LAST_FILE" ]; then
    read -r user host port < "$LAST_FILE"
    echo "$user $host $port"
  else
    echo ""
  fi
}

# Load last connection for specific alias: returns user port
load_alias_last() {
  local alias_name="$1"
  local alias_last_file=$(get_alias_last_file "$alias_name")
  if [ -f "$alias_last_file" ]; then
    read -r user port < "$alias_last_file"
    echo "$user $port"
  else
    echo ""
  fi
}

# Get default user for alias
get_default_user() {
  local alias_name="$1"
  grep -E "^$alias_name=" "$DEFAULT_USERS_FILE" 2>/dev/null | cut -d'=' -f2
}

# Set default user for alias
set_default_user() {
  local alias_name="$1"
  local username="$2"
  # Remove existing entry if present
  grep -vE "^$alias_name=" "$DEFAULT_USERS_FILE" > "$DEFAULT_USERS_FILE.tmp" 2>/dev/null || true
  mv "$DEFAULT_USERS_FILE.tmp" "$DEFAULT_USERS_FILE" 2>/dev/null || true
  # Add new entry
  echo "$alias_name=$username" >> "$DEFAULT_USERS_FILE"
}

# Remove default user for alias
remove_default_user() {
  local alias_name="$1"
  grep -vE "^$alias_name=" "$DEFAULT_USERS_FILE" > "$DEFAULT_USERS_FILE.tmp" 2>/dev/null || true
  mv "$DEFAULT_USERS_FILE.tmp" "$DEFAULT_USERS_FILE" 2>/dev/null || true
}

remove_last_if_matches() {
  if [ -f "$LAST_FILE" ]; then
    read -r _ last_host _ < "$LAST_FILE"
    if [ "$1" = "$last_host" ]; then
      rm -f "$LAST_FILE"
    fi
  fi
}

# Remove alias-specific last user file
remove_alias_last() {
  local alias_name="$1"
  local alias_last_file=$(get_alias_last_file "$alias_name")
  rm -f "$alias_last_file"
}

# Check for updates from GitHub
check_for_updates() {
  local REPO="EinFabo/cts"
  local current_version="$VERSION"
  
  echo -e "${YELLOW}Checking for updates...${NC}"
  
  # Get latest version from GitHub API
  local latest_version=$(curl -s "https://api.github.com/repos/$REPO/releases/latest" 2>/dev/null | grep -oP '"tag_name": "\K(.*)(?=")')
  
  if [ -z "$latest_version" ]; then
    echo -e "${RED}Error:${NC} Could not fetch latest version. Check your internet connection."
    return 1
  fi
  
  # Compare versions (remove 'v' prefix for comparison)
  local current_clean="${current_version#v}"
  local latest_clean="${latest_version#v}"
  
  if [ "$current_clean" = "$latest_clean" ]; then
    echo -e "${GREEN}You are already using the latest version:${NC} $current_version"
    return 0
  fi
  
  echo -e "${YELLOW}New version available!${NC}"
  echo "  Current version: $current_version"
  echo "  Latest version:  $latest_version"
  echo ""
  read -rp "Install latest version? [Y/n]: " confirm
  
  if [[ "$confirm" =~ ^[Nn]$ ]]; then
    echo "Update cancelled."
    return 0
  fi
  
  # Install latest version using install.sh
  echo ""
  echo "Installing latest version..."
  
  # Try to find install.sh in same directory as cts script
  local script_dir="$(cd "$(dirname "$0")" && pwd)"
  local install_script="$script_dir/install.sh"
  
  if [ ! -f "$install_script" ]; then
    # If install.sh not found locally, download it temporarily
    install_script=$(mktemp)
    curl -fsSL "https://raw.githubusercontent.com/$REPO/main/install.sh" -o "$install_script" 2>/dev/null
    if [ $? -ne 0 ]; then
      echo -e "${RED}Error:${NC} Could not download install script."
      rm -f "$install_script"
      return 1
    fi
    chmod +x "$install_script"
  fi
  
  # Run install script with latest version
  bash "$install_script" "$latest_version"
  
  # Clean up temporary install script if we downloaded it
  if [[ "$install_script" == /tmp/* ]]; then
    rm -f "$install_script"
  fi
  
  return 0
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
  -uc)
    check_for_updates
    exit $?
    ;;
  -l)
    filter_tag=""
    # Check if tag filter is specified
    if [ "$2" = "-t" ] && [ -n "$3" ]; then
      filter_tag="$3"
    fi
    
    echo -e "${YELLOW}Saved aliases:${NC}"
    if [ ! -s "$CONFIG_FILE" ]; then
      echo "(none)"
      exit 0
    fi
    
    found_count=0
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
      
      # Filter by tag if specified
      if [ -n "$filter_tag" ]; then
        # Check if filter_tag is in tags (comma-separated)
        if [[ "$tags" == *"$filter_tag"* ]]; then
          # More precise check: ensure it's a complete tag match
          matched=false
          IFS=',' read -ra tag_array <<< "$tags"
          for tag in "${tag_array[@]}"; do
            if [ "$tag" = "$filter_tag" ]; then
              matched=true
              break
            fi
          done
          if [ "$matched" = false ]; then
            continue
          fi
        else
          continue
        fi
      fi
      
      found_count=$((found_count + 1))
      
      if [[ "$host_port" == *:* ]]; then
        port="${host_port##*:}"
        host="${host_port%%:*}"
        if [ -n "$tags" ]; then
          echo "$alias ? $host:$port | tags: $tags"
        else
          echo "$alias ? $host:$port"
        fi
      else
        if [ -n "$tags" ]; then
          echo "$alias ? $host_port | tags: $tags"
        else
          echo "$alias ? $host_port"
        fi
      fi
    done < "$CONFIG_FILE"
    
    if [ -n "$filter_tag" ] && [ $found_count -eq 0 ]; then
      echo "(no aliases found with tag: $filter_tag)"
    fi
    
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
    echo -e "${GREEN}Added alias:${NC} $name ? $host_port"
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
    echo -e "${GREEN}Replaced tags for alias:${NC} $alias_name ? tags: $tags"
    ;;
  -ta)
    if [ -z "$2" ]; then
      echo -e "${RED}Error:${NC} Invalid syntax. Use: cts -ta name tag1,tag2"
      exit 1
    fi
    
    alias_name="$2"
    shift 2
    new_tags="$*"
    new_tags=$(echo "$new_tags" | sed 's/, */,/g')
    
    if ! grep -qE "^$alias_name=" "$CONFIG_FILE"; then
      echo -e "${RED}Error:${NC} Alias '$alias_name' not found."
      exit 1
    fi
    
    # Get current entry
    current_entry=$(get_full_entry "$alias_name")
    host_port="${current_entry%%|*}"
    existing_tags="${current_entry##*|}"
    
    if [[ "$existing_tags" == "$current_entry" ]]; then
      existing_tags=""
    fi
    
    # Merge tags: combine existing and new, remove duplicates
    if [ -n "$existing_tags" ]; then
      all_tags="$existing_tags,$new_tags"
    else
      all_tags="$new_tags"
    fi
    
    # Remove duplicates by converting to array and back
    IFS=',' read -ra tag_array <<< "$all_tags"
    declare -A seen
    unique_tags=""
    for tag in "${tag_array[@]}"; do
      tag=$(echo "$tag" | xargs)  # trim whitespace
      if [ -z "$tag" ]; then
        continue
      fi
      if [ -z "${seen[$tag]}" ]; then
        seen[$tag]=1
        if [ -z "$unique_tags" ]; then
          unique_tags="$tag"
        else
          unique_tags="$unique_tags,$tag"
        fi
      fi
    done
    
    # Update entry with merged tags
    grep -vE "^$alias_name=" "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
    echo "$alias_name=$host_port|$unique_tags" >> "$CONFIG_FILE"
    echo -e "${GREEN}Added tags to alias:${NC} $alias_name ? tags: $unique_tags"
    ;;
  -trm)
    if [ -z "$2" ] || [ -z "$3" ]; then
      echo -e "${RED}Error:${NC} Invalid syntax. Use: cts -trm name tag1"
      exit 1
    fi
    
    alias_name="$2"
    tags_to_remove="$3"
    tags_to_remove=$(echo "$tags_to_remove" | sed 's/, */,/g')
    
    if ! grep -qE "^$alias_name=" "$CONFIG_FILE"; then
      echo -e "${RED}Error:${NC} Alias '$alias_name' not found."
      exit 1
    fi
    
    # Get current entry
    current_entry=$(get_full_entry "$alias_name")
    host_port="${current_entry%%|*}"
    existing_tags="${current_entry##*|}"
    
    if [[ "$existing_tags" == "$current_entry" ]]; then
      echo -e "${RED}Error:${NC} Alias '$alias_name' has no tags to remove."
      exit 1
    fi
    
    # Remove specified tags
    IFS=',' read -ra remove_array <<< "$tags_to_remove"
    IFS=',' read -ra existing_array <<< "$existing_tags"
    remaining_tags=""
    
    for existing_tag in "${existing_array[@]}"; do
      existing_tag=$(echo "$existing_tag" | xargs)
      should_remove=false
      for remove_tag in "${remove_array[@]}"; do
        remove_tag=$(echo "$remove_tag" | xargs)
        if [ "$existing_tag" = "$remove_tag" ]; then
          should_remove=true
          break
        fi
      done
      if [ "$should_remove" = false ] && [ -n "$existing_tag" ]; then
        if [ -z "$remaining_tags" ]; then
          remaining_tags="$existing_tag"
        else
          remaining_tags="$remaining_tags,$existing_tag"
        fi
      fi
    done
    
    # Update entry
    grep -vE "^$alias_name=" "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
    if [ -n "$remaining_tags" ]; then
      echo "$alias_name=$host_port|$remaining_tags" >> "$CONFIG_FILE"
      echo -e "${GREEN}Removed tags from alias:${NC} $alias_name ? remaining tags: $remaining_tags"
    else
      echo "$alias_name=$host_port" >> "$CONFIG_FILE"
      echo -e "${GREEN}Removed all tags from alias:${NC} $alias_name"
    fi
    ;;
  -tc)
    if [ -z "$2" ]; then
      echo -e "${RED}Error:${NC} Invalid syntax. Use: cts -tc name"
      exit 1
    fi
    
    alias_name="$2"
    
    if ! grep -qE "^$alias_name=" "$CONFIG_FILE"; then
      echo -e "${RED}Error:${NC} Alias '$alias_name' not found."
      exit 1
    fi
    
    # Get current entry
    current_entry=$(get_full_entry "$alias_name")
    host_port="${current_entry%%|*}"
    
    # Update entry without tags
    grep -vE "^$alias_name=" "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
    echo "$alias_name=$host_port" >> "$CONFIG_FILE"
    echo -e "${GREEN}Cleared all tags from alias:${NC} $alias_name"
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
    default_user=$(get_default_user "$alias_name")
    alias_last=$(load_alias_last "$alias_name")
    
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
    if [ -n "$default_user" ]; then
      echo "  Default User: $default_user"
    else
      echo "  Default User: (none)"
    fi
    if [ -n "$alias_last" ]; then
      read -r last_user _ <<< "$alias_last"
      echo "  Last Used User: $last_user"
    else
      echo "  Last Used User: (none)"
    fi
    exit 0
    ;;
  -du)
    if [ -z "$2" ] || [ -z "$3" ]; then
      echo -e "${RED}Error:${NC} Invalid syntax. Use: cts -du aliasname username"
      exit 1
    fi
    
    alias_name="$2"
    username="$3"
    
    if ! grep -qE "^$alias_name=" "$CONFIG_FILE"; then
      echo -e "${RED}Error:${NC} Alias '$alias_name' not found."
      exit 1
    fi
    
    set_default_user "$alias_name" "$username"
    echo -e "${GREEN}Set default user for alias:${NC} $alias_name ? $username"
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
    
    # Move alias-specific files
    old_alias_last_file=$(get_alias_last_file "$old_name")
    new_alias_last_file=$(get_alias_last_file "$new_name")
    if [ -f "$old_alias_last_file" ]; then
      mv "$old_alias_last_file" "$new_alias_last_file"
    fi
    
    # Move default user entry
    default_user=$(get_default_user "$old_name")
    if [ -n "$default_user" ]; then
      remove_default_user "$old_name"
      set_default_user "$new_name" "$default_user"
    fi
    
    echo -e "${GREEN}Renamed alias:${NC} $old_name ? $new_name"
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
      remove_alias_last "$2"
      remove_default_user "$2"
      echo -e "${GREEN}Removed alias:${NC} $2"
    else
      echo -e "${RED}Error:${NC} Alias '$2' not found."
    fi
    ;;
  -rma)
    echo -e "${YELLOW}This will delete all aliases and last connection data.${NC}"
    read -rp "Are you sure? [y/N]: " confirm
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
      rm -f "$CONFIG_FILE" "$LAST_FILE" "$DEFAULT_USERS_FILE"
      rm -f "$HOME/.cts_last_"*
      touch "$CONFIG_FILE"
      touch "$DEFAULT_USERS_FILE"
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
      # Case: cts alias
      alias="$1"
      host=$(get_host "$alias")
      if [ -z "$host" ]; then
        echo -e "${RED}Error:${NC} Alias '$alias' not found."
        exit 1
      fi
      
      # Get default user first
      user=$(get_default_user "$alias")
      
      # If no default user, try alias-specific last user
      if [ -z "$user" ]; then
        alias_last=$(load_alias_last "$alias")
        if [ -n "$alias_last" ]; then
          read -r user _ <<< "$alias_last"
        fi
      fi
      
      # If still no user, show error
      if [ -z "$user" ]; then
        echo -e "${RED}Error:${NC} No user found for alias '$alias'."
        echo "Connect once using 'cts <user> <alias>' or set a default user with 'cts -du $alias username'."
        echo "Run 'cts -help' for more information."
        exit 1
      fi
      
      port=$(get_port "$alias")
      if [ -n "$port" ]; then
        echo -e "${GREEN}Connecting:${NC} $user@$host:$port"
        save_last "$user" "$host" "$port"
        save_alias_last "$alias" "$user" "$port"
        exec ssh -p "$port" "${user}@${host}"
      else
        echo -e "${GREEN}Connecting:${NC} $user@$host"
        save_last "$user" "$host" ""
        save_alias_last "$alias" "$user" ""
        exec ssh "${user}@${host}"
      fi
    elif [ $# -eq 2 ]; then
      # Check if second argument is -nd flag
      if [ "$2" = "-nd" ]; then
        # Case: cts alias -nd (use last user instead of default)
        alias="$1"
        host=$(get_host "$alias")
        if [ -z "$host" ]; then
          echo -e "${RED}Error:${NC} Alias '$alias' not found."
          exit 1
        fi
        
        # Get alias-specific last user
        alias_last=$(load_alias_last "$alias")
        if [ -z "$alias_last" ]; then
          echo -e "${RED}Error:${NC} No previously used user found for alias '$alias'."
          echo "Connect once using 'cts <user> <alias>' first."
          echo "Run 'cts -help' for more information."
          exit 1
        fi
        
        read -r user _ <<< "$alias_last"
        port=$(get_port "$alias")
        if [ -n "$port" ]; then
          echo -e "${GREEN}Connecting:${NC} $user@$host:$port (using last user)"
          save_last "$user" "$host" "$port"
          save_alias_last "$alias" "$user" "$port"
          exec ssh -p "$port" "${user}@${host}"
        else
          echo -e "${GREEN}Connecting:${NC} $user@$host (using last user)"
          save_last "$user" "$host" ""
          save_alias_last "$alias" "$user" ""
          exec ssh "${user}@${host}"
        fi
      else
        # Case: cts user alias
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
          save_alias_last "$alias" "$user" "$port"
          exec ssh -p "$port" "${user}@${host}"
        else
          echo -e "${GREEN}Connecting:${NC} $user@$host"
          save_last "$user" "$host" ""
          save_alias_last "$alias" "$user" ""
          exec ssh "${user}@${host}"
        fi
      fi
    else
      show_help
      exit 1
    fi
    ;;
esac
