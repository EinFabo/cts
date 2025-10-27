#!/usr/bin/env bash

# Usage:
#   cts <username> <hostname>
# Beispiele:
#   cts admin ai
#   cts main Main

if [ "$#" -ne 2 ]; then
  echo "Usage: cts <username> <hostname>"
  exit 1
fi

username="$1"
hostname="$2"

case "$hostname" in
  ip)
    hostname="192.69.17.5"
    ;;
  ex)
    hostname="exaple.com"
    ;;
esac

exec ssh "${username}@${hostname}"
