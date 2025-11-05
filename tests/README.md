# CTS Test Suite

This directory contains automated tests for CTS using [bats](https://github.com/bats-core/bats-core) (Bash Automated Testing System).

## Prerequisites

Install bats on your system:

### Ubuntu/Debian
```bash
sudo apt-get install bats
```

### Arch Linux
```bash
sudo pacman -S bats
```

### macOS (Homebrew)
```bash
brew install bats-core
```

### Manual Installation
```bash
git clone https://github.com/bats-core/bats-core.git
cd bats-core
sudo ./install.sh /usr/local
```

## Running Tests

Run all tests:
```bash
cd tests
bats *.bats
```

Run specific test file:
```bash
bats test_basic.bats
```

Run with verbose output:
```bash
bats --verbose-run *.bats
```

## Test Files

- **test_basic.bats** - Basic functionality tests (add, remove, list, rename aliases)
- **test_tags.bats** - Tag management tests (add, remove, filter tags)
- **test_users_export.bats** - User management and import/export tests

## Writing New Tests

Each test file follows this structure:

```bash
#!/usr/bin/env bats

setup() {
  # Create temporary test environment
  export TEST_HOME=$(mktemp -d)
  export HOME="$TEST_HOME"
  export CTS_BIN="${BATS_TEST_DIRNAME}/../cts"
}

teardown() {
  # Clean up
  rm -rf "$TEST_HOME"
}

@test "description of test" {
  run "$CTS_BIN" -some-command
  [ "$status" -eq 0 ]
  [[ "$output" =~ "expected output" ]]
}
```

## CI Integration

To run tests in CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Install bats
  run: sudo apt-get install -y bats

- name: Run tests
  run: cd tests && bats *.bats
```
