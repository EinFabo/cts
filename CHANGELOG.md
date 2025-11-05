# Changelog

All notable changes to CTS (Connect To Server) will be documented in this file.

## [v1.5.0] - 2025

### Added
- **Comprehensive Input Validation**
  - Alias names are validated (no spaces, `=`, or `|` characters)
  - Hostnames are validated (alphanumeric with dots, hyphens, underscores)
  - Port numbers are validated (1-65535 range)
  - Usernames are validated (alphanumeric with dots, hyphens, underscores)
- **Automated Test Suite**
  - 40+ tests using bats (Bash Automated Testing System)
  - Test coverage for basic operations, tags, users, and import/export
  - `run_tests.sh` script for easy test execution
  - Detailed test documentation in `tests/README.md`
- **Config File Protection**
  - Automatic backup creation before modifications
  - Protection against accidental config file corruption
  - Safe file update operations with rollback capability
- **.gitignore** file to exclude temporary and backup files

### Improved
- **Error Handling**
  - Better error messages throughout the application
  - Detailed network error messages for update checks
  - Timeout handling for network operations (10s for API calls, 30s for downloads)
  - Proper exit codes for all error conditions
- **Update Check (`-uc`)**
  - Check if curl is installed before attempting updates
  - Specific error messages for different failure modes (timeout, DNS, network)
  - Better handling of temporary files during update
  - Improved error reporting when installation fails
- **Robustness**
  - All file operations now include error checking
  - Config directory creation with proper error handling
  - Validation of file permissions on startup

### Fixed
- Version number consistency (was showing v1.4.1 in header, v1.4.2 in VERSION)

### Documentation
- Updated README with v1.5.0 information
- Added Testing section to README
- Added detailed changelog
- Created test suite documentation

## [v1.4.2] - 2024

### Added
- Update checking functionality (`-uc`)
- Automatic update installation via GitHub releases

### Fixed
- Various bug fixes and improvements

## [v1.4.1] - 2024

### Improved
- Better tag support
- Default user handling fixes

### Fixed
- Tag parsing edge cases
- Default user persistence issues

## [v1.4.0] - 2024

### Added
- Tag management system
  - Add tags with `-t` (replace) and `-ta` (append)
  - Remove tags with `-trm`
  - Clear all tags with `-tc`
  - Filter aliases by tag with `-l -t <tag>`
- Default user per alias (`-du`)
- Per-alias connection memory

### Improved
- Enhanced alias information display (`-i`)
- Better connection logic with default user fallback

## [v1.3.0] - 2024

### Added
- Import/Export functionality
- Alias renaming (`-rn`)
- Bash completion support

### Improved
- Color-coded output
- Help documentation

## [v1.2.0] - 2024

### Added
- Custom port support (`name=host:port`)
- Last connection memory

## [v1.1.0] - 2024

### Added
- Basic alias management
- SSH connection shortcuts

## [v1.0.0] - 2024

### Added
- Initial release
- Basic SSH connection functionality
