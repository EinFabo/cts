#!/usr/bin/env bash
set -e

echo "📦 Installing cts..."

mkdir -p "$HOME/bin"

curl -fsSL "https://raw.githubusercontent.com/EinFabo/cts/main/cts" -o "$HOME/bin/cts"

chmod +x "$HOME/bin/cts"

if ! echo "$PATH" | grep -q "$HOME/bin"; then
  echo 'export PATH=$HOME/bin:$PATH' >> "$HOME/.bashrc"
  echo "🔧 PATH wurde angepasst. Starte Termux neu oder führe 'source ~/.bashrc' aus."
fi

echo "✅ Installation abgeschlossen. Du kannst jetzt 'cts' verwenden."
