# CTS – Connect To Server

**CTS (Connect To Server)** is a lightweight command-line tool designed to simplify SSH connections by enabling you to define custom host shortcuts. Connect to your servers quickly without typing full usernames or IP addresses every time.

## Features

- **Quick SSH Connections** - Connect with simple aliases instead of long SSH commands
- **Port Support** - Specify custom SSH ports directly in aliases (`alias=host:port`)
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
curl -s https://raw.githubusercontent.com/EinFabo/cts/main/install.sh | bash -s v1.3.1
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

Remove a specific alias:

```bash
cts -rm name
```

Remove all aliases (requires confirmation):

```bash
cts -rma
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

# Connect to server with username
cts user myserver

# Connect using saved username (from previous connection)
cts myserver

# Reconnect to last server
cts

# List all aliases
cts -l

# Remove an alias
cts -rm myserver
```

## Bash Completion

CTS includes bash completion support that is automatically installed during setup. After installation, you can use tab completion for:

- **Alias names** - Press `Tab` after typing `cts` or `cts <partial-alias>`
- **Options** - Press `Tab` after `cts -` to see available options
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
alias3=host3:port
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

## Version

Current version: **v1.3.1**

## License

MIT License
