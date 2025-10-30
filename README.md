# CTS – Connect To Server

**CTS (Connect To Server)** is a lightweight command-line tool for quick SSH access.  
It lets you define custom host shortcuts so you can connect to servers without typing full usernames or IP addresses every time!

---

## Features

- 🚀 **Quick SSH connections** - Connect with simple aliases
- 🔌 **Port support** - Specify custom SSH ports (`alias=host:port`)
- ⌨️ **Bash completion** - Tab completion for aliases and options
- 💾 **Last connection memory** - Quickly reconnect to your last used server
- 📦 **Import/Export** - Share and backup your aliases
- 🎨 **Color-coded output** - Easy to read messages

---

## Installation

Run the following command to install CTS:

```bash
curl -s https://raw.githubusercontent.com/EinFabo/cts/main/install.sh | bash
```

Or install a specific version:

```bash
curl -s https://raw.githubusercontent.com/EinFabo/cts/main/install.sh | bash -s v1.3.1
```

After installation, make sure `$HOME/bin` is in your PATH. If completion doesn't work immediately, run:
```bash
source ~/.bashrc
```
Or restart your terminal.

---

## Usage

### Basic Commands

```bash
# Connect using alias with username
cts <username> <alias>

# Connect using saved username (from last connection)
cts <alias>

# Reconnect to last used host
cts
```

### Managing Aliases

```bash
# Add alias (standard port 22)
cts -a name=host

# Add alias with custom port
cts -a name=host:2222

# List all aliases
cts -l

# Remove alias
cts -rm name

# Remove all aliases (with confirmation)
cts -rma
```

### Import/Export

```bash
# Export aliases to file
cts -export ~/backup/aliases.txt

# Import aliases from file
cts -import ~/backup/aliases.txt
```

### Other Options

```bash
# Show help
cts -help

# Show version
cts -v
```

---

## Examples

```bash
# Add a server with standard port
cts -a myserver=192.168.1.100

# Add a server with custom port
cts -a devserver=dev.example.com:2222

# Connect to server
cts user myserver

# Next time, just use the alias (username is remembered)
cts myserver

# Reconnect to last server
cts
```

---

## Bash Completion

CTS includes bash completion support that is automatically installed. After installation, you can:

- Press `Tab` to complete alias names
- Press `Tab` to complete options (`-a`, `-rm`, `-l`, etc.)
- Press `Tab` after `-rm` to see available aliases
- Press `Tab` after `-export` or `-import` to complete file paths

---

## Configuration

CTS stores its configuration in:
- **Aliases**: `~/.cts_hosts`
- **Last connection**: `~/.cts_last`

You can manually edit `~/.cts_hosts` if needed. Format:
```
alias1=host1
alias2=host2:2222
alias3=host3:port
```

---

## Version

Current version: **v1.3.1**

---

## License

MIT License
