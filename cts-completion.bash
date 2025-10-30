#!/bin/bash
# ========================================
# CTS Bash Completion Script
# ========================================
# This script provides tab completion for the CTS command
# It will be automatically sourced when CTS is installed
# ========================================

_cts_completion() {
    local cur prev opts
    COMPREPLY=()
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"
    
    # Get config file path
    local config_file="${HOME}/.cts_hosts"
    
    # Options that CTS supports
    opts="-a -rm -rma -l -t -i -rn -export -import -v -help"
    
    # If previous word was -t, don't complete (user needs to type alias name, then tags)
    if [[ "$prev" == "-t" ]]; then
        if [[ -f "$config_file" ]]; then
            local aliases=$(cut -d'=' -f1 "$config_file" 2>/dev/null)
            COMPREPLY=( $(compgen -W "$aliases" -- "$cur") )
        fi
        return 0
    fi
    
    # If previous word was -i or -rn, complete alias names
    if [[ "$prev" == "-i" ]] || [[ "$prev" == "-rn" ]]; then
        if [[ -f "$config_file" ]]; then
            local aliases=$(cut -d'=' -f1 "$config_file" 2>/dev/null)
            COMPREPLY=( $(compgen -W "$aliases" -- "$cur") )
        fi
        return 0
    fi
    
    # If previous word was -a, don't complete (user needs to type name=host)
    if [[ "$prev" == "-a" ]]; then
        return 0
    fi
    
    # If previous word was -export or -import, complete files
    if [[ "$prev" == "-export" ]] || [[ "$prev" == "-import" ]]; then
        COMPREPLY=( $(compgen -f -- "$cur") )
        return 0
    fi
    
    # If previous word was -rm, complete alias names
    if [[ "$prev" == "-rm" ]]; then
        if [[ -f "$config_file" ]]; then
            # Extract alias names from config file
            local aliases=$(cut -d'=' -f1 "$config_file" 2>/dev/null)
            COMPREPLY=( $(compgen -W "$aliases" -- "$cur") )
        fi
        return 0
    fi
    
    # If current word starts with -, complete options
    if [[ "$cur" == -* ]]; then
        COMPREPLY=( $(compgen -W "$opts" -- "$cur") )
        return 0
    fi
    
    # If we're at position 1 (first argument), check if it's a valid option or alias
    if [[ $COMP_CWORD -eq 1 ]]; then
        # First check if it's an option
        if [[ "$cur" == -* ]]; then
            COMPREPLY=( $(compgen -W "$opts" -- "$cur") )
            return 0
        fi
        
        # Otherwise, try to complete alias names
        if [[ -f "$config_file" ]]; then
            local aliases=$(cut -d'=' -f1 "$config_file" 2>/dev/null)
            COMPREPLY=( $(compgen -W "$aliases" -- "$cur") )
        fi
        return 0
    fi
    
    # If we're at position 2 and first word wasn't an option, complete alias names
    if [[ $COMP_CWORD -eq 2 ]] && [[ ! "${COMP_WORDS[1]}" == -* ]]; then
        if [[ -f "$config_file" ]]; then
            local aliases=$(cut -d'=' -f1 "$config_file" 2>/dev/null)
            COMPREPLY=( $(compgen -W "$aliases" -- "$cur") )
        fi
        return 0
    fi
    
    return 0
}

# Register completion function for 'cts' command
complete -F _cts_completion cts
