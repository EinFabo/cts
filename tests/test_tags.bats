#!/usr/bin/env bats

# Tag management tests for CTS

setup() {
  export TEST_HOME=$(mktemp -d)
  export HOME="$TEST_HOME"
  export CTS_BIN="${BATS_TEST_DIRNAME}/../cts"

  # Add test aliases
  "$CTS_BIN" -a "server1=192.168.1.100"
  "$CTS_BIN" -a "server2=192.168.1.101"
}

teardown() {
  rm -rf "$TEST_HOME"
}

@test "cts -t adds tags to alias" {
  run "$CTS_BIN" -t server1 docker,production
  [ "$status" -eq 0 ]
  [[ "$output" =~ "Replaced tags" ]]
  [[ "$output" =~ "docker,production" ]]
}

@test "cts -ta appends tags to alias" {
  "$CTS_BIN" -t server1 docker
  run "$CTS_BIN" -ta server1 production,nginx
  [ "$status" -eq 0 ]
  [[ "$output" =~ "Added tags" ]]

  # Check that all tags are present
  run "$CTS_BIN" -i server1
  [[ "$output" =~ "docker" ]]
  [[ "$output" =~ "production" ]]
  [[ "$output" =~ "nginx" ]]
}

@test "cts -ta removes duplicate tags" {
  "$CTS_BIN" -t server1 docker,production
  run "$CTS_BIN" -ta server1 docker,nginx
  [ "$status" -eq 0 ]

  # Verify docker appears only once
  run "$CTS_BIN" -i server1
  [ "$status" -eq 0 ]
  # Count occurrences of "docker" in tags line
  tag_line=$(echo "$output" | grep "Tags:")
  count=$(echo "$tag_line" | grep -o "docker" | wc -l)
  [ "$count" -eq 1 ]
}

@test "cts -trm removes specific tag" {
  "$CTS_BIN" -t server1 docker,production,nginx
  run "$CTS_BIN" -trm server1 production
  [ "$status" -eq 0 ]
  [[ "$output" =~ "Removed tags" ]]

  # Verify production is gone but others remain
  run "$CTS_BIN" -i server1
  [[ "$output" =~ "docker" ]]
  [[ "$output" =~ "nginx" ]]
  [[ ! "$output" =~ "production" ]]
}

@test "cts -tc clears all tags" {
  "$CTS_BIN" -t server1 docker,production,nginx
  run "$CTS_BIN" -tc server1
  [ "$status" -eq 0 ]
  [[ "$output" =~ "Cleared all tags" ]]

  # Verify no tags remain
  run "$CTS_BIN" -i server1
  [[ "$output" =~ "Tags: (none)" ]]
}

@test "cts -l shows tags" {
  "$CTS_BIN" -t server1 docker,production
  run "$CTS_BIN" -l
  [ "$status" -eq 0 ]
  [[ "$output" =~ "server1" ]]
  [[ "$output" =~ "docker,production" ]]
}

@test "cts -l -t filters by tag" {
  "$CTS_BIN" -t server1 docker,production
  "$CTS_BIN" -t server2 nginx,staging

  run "$CTS_BIN" -l -t docker
  [ "$status" -eq 0 ]
  [[ "$output" =~ "server1" ]]
  [[ ! "$output" =~ "server2" ]]
}

@test "cts -l -t shows message when no matches" {
  "$CTS_BIN" -t server1 docker
  run "$CTS_BIN" -l -t nonexistent
  [ "$status" -eq 0 ]
  [[ "$output" =~ "no aliases found with tag: nonexistent" ]]
}

@test "tags with spaces are normalized" {
  run "$CTS_BIN" -t server1 "docker, production, nginx"
  [ "$status" -eq 0 ]

  run "$CTS_BIN" -i server1
  # Check that tags don't have spaces after commas
  [[ "$output" =~ "docker,production,nginx" ]] || [[ "$output" =~ "Tags: docker,production,nginx" ]]
}
