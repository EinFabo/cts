#!/usr/bin/env bats

# User management and import/export tests for CTS

setup() {
  export TEST_HOME=$(mktemp -d)
  export HOME="$TEST_HOME"
  export CTS_BIN="${BATS_TEST_DIRNAME}/../cts"

  # Add test alias
  "$CTS_BIN" -a "testserver=192.168.1.100"
}

teardown() {
  rm -rf "$TEST_HOME"
}

@test "cts -du sets default user" {
  run "$CTS_BIN" -du testserver john
  [ "$status" -eq 0 ]
  [[ "$output" =~ "Set default user" ]]
  [[ "$output" =~ "john" ]]

  # Verify it's set in alias info
  run "$CTS_BIN" -i testserver
  [[ "$output" =~ "Default User: john" ]]
}

@test "cts -du rejects invalid username" {
  run "$CTS_BIN" -du testserver "john doe"
  [ "$status" -eq 1 ]
  [[ "$output" =~ "Invalid username" ]]
}

@test "cts -du rejects username with special characters" {
  run "$CTS_BIN" -du testserver "john@invalid"
  [ "$status" -eq 1 ]
  [[ "$output" =~ "Invalid username" ]]
}

@test "cts -export creates backup file" {
  "$CTS_BIN" -a "server1=192.168.1.100"
  "$CTS_BIN" -a "server2=192.168.1.101:2222"

  export_file="$TEST_HOME/backup.txt"
  run "$CTS_BIN" -export "$export_file"
  [ "$status" -eq 0 ]
  [[ "$output" =~ "Exported aliases" ]]

  # Verify file exists and contains aliases
  [ -f "$export_file" ]
  grep -q "server1=192.168.1.100" "$export_file"
  grep -q "server2=192.168.1.101:2222" "$export_file"
}

@test "cts -import loads aliases from file" {
  # Create export file manually
  export_file="$TEST_HOME/import.txt"
  echo "imported1=10.0.0.1" > "$export_file"
  echo "imported2=10.0.0.2:3333" >> "$export_file"

  run "$CTS_BIN" -import "$export_file"
  [ "$status" -eq 0 ]
  [[ "$output" =~ "Imported 2 alias" ]]

  # Verify aliases were imported
  run "$CTS_BIN" -l
  [[ "$output" =~ "imported1" ]]
  [[ "$output" =~ "imported2" ]]
}

@test "cts -import skips duplicate aliases" {
  "$CTS_BIN" -a "existing=192.168.1.100"

  export_file="$TEST_HOME/import.txt"
  echo "existing=192.168.1.100" > "$export_file"
  echo "newone=10.0.0.1" >> "$export_file"

  run "$CTS_BIN" -import "$export_file"
  [ "$status" -eq 0 ]
  [[ "$output" =~ "Imported 1 alias" ]]
}

@test "cts -import shows error for nonexistent file" {
  run "$CTS_BIN" -import "/nonexistent/file.txt"
  [ "$status" -eq 1 ]
  [[ "$output" =~ "File not found" ]]
}

@test "cts -export requires file path" {
  run "$CTS_BIN" -export
  [ "$status" -eq 1 ]
  [[ "$output" =~ "Missing export file path" ]]
}

@test "cts -import requires file path" {
  run "$CTS_BIN" -import
  [ "$status" -eq 1 ]
  [[ "$output" =~ "Missing import file path" ]]
}

@test "importing aliases with tags works" {
  export_file="$TEST_HOME/import_tags.txt"
  echo "tagged=10.0.0.1|docker,production" > "$export_file"

  run "$CTS_BIN" -import "$export_file"
  [ "$status" -eq 0 ]

  # Verify tags were imported
  run "$CTS_BIN" -i tagged
  [[ "$output" =~ "docker" ]]
  [[ "$output" =~ "production" ]]
}
