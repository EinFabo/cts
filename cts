#!/usr/bin/env bash

CONFIG="$HOME/.cts_hosts"

# === 1. Shortcut hinzufügen ===
if [ "$1" = "." ] && [[ "$2" =~ = ]]; then
  # Format: cts . Name=IP
  name="${2%%=*}"
  ip="${2#*=}"

  # Datei anlegen, falls nicht vorhanden
  touch "$CONFIG"

  # Überschreiben, falls Name schon existiert
  grep -v "^$name=" "$CONFIG" 2>/dev/null > "$CONFIG.tmp" || true
  echo "$name=$ip" >> "$CONFIG.tmp"
  mv "$CONFIG.tmp" "$CONFIG"

  echo "✅ Shortcut hinzugefügt: $name -> $ip"
  exit 0
fi

# === 2. Normale SSH-Verbindung ===
if [ "$#" -ne 2 ]; then
  echo "Usage: cts <username> <hostname> oder cts . Name=IP"
  exit 1
fi

username="$1"
hostname="$2"

# Hostnamen aus Shortcut-Datei auflösen
if [ -f "$CONFIG" ]; then
  host_ip=$(grep "^$hostname=" "$CONFIG" | cut -d= -f2)
  if [ -n "$host_ip" ]; then
    hostname="$host_ip"
  fi
fi

# SSH ausführen
exec ssh "${username}@${hostname}"
