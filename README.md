# CTS – Connect To Server

**CTS (Connect To Server)** is a lightweight command-line tool designed to simplify SSH connections by enabling you to define custom host shortcuts. Connect to your servers quickly without typing full usernames or IP addresses every time.

## Features

- **Quick SSH Connections** - Connect with simple aliases instead of long SSH commands
- **Port Support** - Specify custom SSH ports directly in aliases (`alias=host:port`)
- **Tag Management** - Organize and categorize aliases with tags
- **Bash Auto-Completion** - Tab completion for aliases, options, and file paths
- **Connection Memory** - Automatically remembers your last connection for quick reconnection
- **Import/Export** - Share and backup your alias configurations
- **Color-Coded Output** - Clear, readable command-line interface

## Installation

Install CTS using the following command:

```bash
curl -s https://raw.githubusercontent.com/EinFabo/cts/main/install.sh | bash
```

To install a specific version:

```bash
curl -s https://raw.githubusercontent.com/EinFabo/cts/main/install.sh | bash -s v1.5.0
```

After installation, ensure `$HOME/bin` is in your PATH. If bash completion doesn't work immediately, run:

```bash
source ~/.bashrc
```

Or restart your terminal.

## Usage

### Basic Commands

Connect to a server using an alias with a username:

```bash
cts <username> <alias>
```

Connect using a saved username (from your last connection):

```bash
cts <alias>
```

Reconnect to the last used host:

```bash
cts
```

### Managing Aliases

Add an alias with the default SSH port (22):

```bash
cts -a name=host
```

Add an alias with a custom port:

```bash
cts -a name=host:2222
```

List all configured aliases:

```bash
cts -l
```

List aliases filtered by tag:

```bash
cts -l -t docker
```

Remove a specific alias:

```bash
cts -rm name
```

Remove all aliases (requires confirmation):

```bash
cts -rma
```

Rename an alias:

```bash
cts -rn oldname newname
```

### Tag Management

Add tags to an alias (appends without replacing existing tags):

```bash
cts -ta name tag1,tag2
```

Replace all tags for an alias:

```bash
cts -t name tag1,tag2
```

Remove specific tag(s) from an alias:

```bash
cts -trm name tag1
```

Clear all tags from an alias:

```bash
cts -tc name
```

View alias information including tags:

```bash
cts -i name
```

### Import and Export

Export your aliases to a file:

```bash
cts -export ~/backup/aliases.txt
```

Import aliases from a file:

```bash
cts -import ~/backup/aliases.txt
```

### Additional Options

Display help information:

```bash
cts -help
```

Display version information:

```bash
cts -v
```

## Examples

```bash
# Add a server with default port
cts -a myserver=192.168.1.100

# Add a server with custom SSH port
cts -a devserver=dev.example.com:2222

# Add tags to an alias
cts -ta webserver production,docker,nginx

# List all aliases
cts -l

# List only aliases with specific tag
cts -l -t docker

# View alias information
cts -i webserver

# Remove specific tag
cts -trm webserver production

# Connect to server with username
cts user myserver

# Connect using saved username (from previous connection)
cts myserver

# Reconnect to last server
cts

# Rename an alias
cts -rn webserver webserver-prod

# Export configuration
cts -export ~/backup/aliases.txt

# Import configuration
cts -import ~/backup/aliases.txt
```

## Bash Completion

CTS includes bash completion support that is automatically installed during setup. After installation, you can use tab completion for:

- **Alias names** - Press `Tab` after typing `cts` or `cts <partial-alias>`
- **Options** - Press `Tab` after `cts -` to see available options
- **Tag names** - Press `Tab` after `cts -l -t` to see available tags
- **Alias removal** - Press `Tab` after `cts -rm` to see available aliases
- **File paths** - Press `Tab` after `cts -export` or `cts -import` to complete file paths

## Configuration

CTS stores its configuration files in your home directory:

- **Aliases**: `~/.cts_hosts`
- **Last connection**: `~/.cts_last`

You can manually edit `~/.cts_hosts` if needed. The format is:

```
alias1=host1
alias2=host2:2222
alias3=host3:port|tag1,tag2
alias4=host4|tag1,tag2
```

## Port Support

CTS supports custom SSH ports using the format `alias=host:port`. When connecting, CTS automatically uses the specified port with the SSH command (`ssh -p port user@host`). If no port is specified, the default SSH port (22) is used.

Examples:

```bash
# Add alias with custom port
cts -a webserver=web.example.com:2222

# Add alias with default port (explicit)
cts -a database=db.example.com:22

# Add alias without port (defaults to 22)
cts -a fileserver=fs.example.com
```

## Tag Management

Tags allow you to organize and categorize your aliases for better management. Tags are stored with the alias and can be used for filtering and organization.

### Tag Operations

**Add Tags (`-ta`):**
Adds new tags to an existing alias without removing existing tags. Duplicates are automatically removed.

```bash
cts -ta webserver production,docker
```

**Replace Tags (`-t`):**
Replaces all existing tags with new ones.

```bash
cts -t webserver production,nginx
```

**Remove Tags (`-trm`):**
Removes specific tags from an alias. Multiple tags can be specified separated by commas.

```bash
cts -trm webserver production
cts -trm webserver tag1,tag2
```

**Clear Tags (`-tc`):**
Removes all tags from an alias.

```bash
cts -tc webserver
```

### Tag Filtering

List aliases filtered by a specific tag:

```bash
cts -l -t docker
```

This displays only aliases that have the specified tag. If no aliases match, a message is displayed indicating no matches were found.

### Tag Format

Tags are comma-separated values. Spaces after commas are automatically normalized. Tags can contain any characters except commas.

Examples:
- `docker,nginx,production`
- `docker, nginx, production` (spaces are normalized)

## Version

Current version: **v1.5.0**

### Changelog

#### v1.5.0 (2025)
- **Improved Error Handling**: Better validation and error messages throughout
  - Input validation for alias names, hostnames, ports, and usernames
  - Improved config file handling with automatic backup
  - Better error messages for network issues during update checks
- **Enhanced Robustness**: Config file corruption protection and safer file operations
- **Better Network Error Handling**: Timeout handling and detailed error messages for update checks

#### v1.4.2 (2024)
- Added update checking functionality (`-uc`)
- Bug fixes and improvements

#### v1.4.1 (2024)
- Better tag support
- Default user fixes

## License

MIT License
