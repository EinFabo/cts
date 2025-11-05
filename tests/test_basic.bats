#!/usr/bin/env bats

# Basic functionality tests for CTS

setup() {
  # Create temporary test directory
  export TEST_HOME=$(mktemp -d)
  export HOME="$TEST_HOME"
  export CTS_BIN="${BATS_TEST_DIRNAME}/../cts"
}

teardown() {
  # Clean up test directory
  rm -rf "$TEST_HOME"
}

@test "cts -v shows version" {
  run "$CTS_BIN" -v
  [ "$status" -eq 0 ]
  [[ "$output" =~ "CTS version v1.5.0" ]]
}

@test "cts -help shows help message" {
  run "$CTS_BIN" -help
  [ "$status" -eq 0 ]
  [[ "$output" =~ "CTS (Connect To Server)" ]]
  [[ "$output" =~ "Usage:" ]]
}

@test "cts -l with no aliases shows empty list" {
  run "$CTS_BIN" -l
  [ "$status" -eq 0 ]
  [[ "$output" =~ "Saved aliases:" ]]
  [[ "$output" =~ "(none)" ]]
}

@test "cts -a adds an alias successfully" {
  run "$CTS_BIN" -a "testserver=192.168.1.100"
  [ "$status" -eq 0 ]
  [[ "$output" =~ "Added alias:" ]]
  [[ "$output" =~ "testserver" ]]
}

@test "cts -a adds an alias with port successfully" {
  run "$CTS_BIN" -a "testserver=192.168.1.100:2222"
  [ "$status" -eq 0 ]
  [[ "$output" =~ "Added alias:" ]]
  [[ "$output" =~ "testserver" ]]
  [[ "$output" =~ "2222" ]]
}

@test "cts -a rejects invalid alias name with spaces" {
  run "$CTS_BIN" -a "test server=192.168.1.100"
  [ "$status" -eq 1 ]
  [[ "$output" =~ "Invalid alias name" ]]
}

@test "cts -a rejects invalid alias name with pipe" {
  run "$CTS_BIN" -a "test|server=192.168.1.100"
  [ "$status" -eq 1 ]
  [[ "$output" =~ "Invalid alias name" ]]
}

@test "cts -a rejects invalid port number" {
  run "$CTS_BIN" -a "testserver=192.168.1.100:99999"
  [ "$status" -eq 1 ]
  [[ "$output" =~ "Invalid port" ]]
}

@test "cts -a rejects invalid port (non-numeric)" {
  run "$CTS_BIN" -a "testserver=192.168.1.100:abc"
  [ "$status" -eq 1 ]
  [[ "$output" =~ "Invalid port" ]]
}

@test "cts -a rejects duplicate alias" {
  "$CTS_BIN" -a "testserver=192.168.1.100"
  run "$CTS_BIN" -a "testserver=192.168.1.101"
  [ "$status" -eq 1 ]
  [[ "$output" =~ "already exists" ]]
}

@test "cts -l shows added alias" {
  "$CTS_BIN" -a "testserver=192.168.1.100"
  run "$CTS_BIN" -l
  [ "$status" -eq 0 ]
  [[ "$output" =~ "testserver" ]]
  [[ "$output" =~ "192.168.1.100" ]]
}

@test "cts -i shows alias information" {
  "$CTS_BIN" -a "testserver=192.168.1.100:2222"
  run "$CTS_BIN" -i testserver
  [ "$status" -eq 0 ]
  [[ "$output" =~ "Alias Information:" ]]
  [[ "$output" =~ "Name: testserver" ]]
  [[ "$output" =~ "Host: 192.168.1.100" ]]
  [[ "$output" =~ "Port: 2222" ]]
}

@test "cts -rm removes alias" {
  "$CTS_BIN" -a "testserver=192.168.1.100"
  run "$CTS_BIN" -rm testserver
  [ "$status" -eq 0 ]
  [[ "$output" =~ "Removed alias:" ]]

  # Verify alias is gone
  run "$CTS_BIN" -l
  [[ ! "$output" =~ "testserver" ]]
}

@test "cts -rm with nonexistent alias shows error" {
  run "$CTS_BIN" -rm nonexistent
  [ "$status" -ne 0 ]
  [[ "$output" =~ "not found" ]]
}

@test "cts -rn renames alias" {
  "$CTS_BIN" -a "oldname=192.168.1.100"
  run "$CTS_BIN" -rn oldname newname
  [ "$status" -eq 0 ]
  [[ "$output" =~ "Renamed alias:" ]]

  # Verify new name exists
  run "$CTS_BIN" -l
  [[ "$output" =~ "newname" ]]
  [[ ! "$output" =~ "oldname" ]]
}

@test "cts -rn rejects if new name already exists" {
  "$CTS_BIN" -a "name1=192.168.1.100"
  "$CTS_BIN" -a "name2=192.168.1.101"
  run "$CTS_BIN" -rn name1 name2
  [ "$status" -eq 1 ]
  [[ "$output" =~ "already exists" ]]
}
