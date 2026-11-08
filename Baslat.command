#!/bin/zsh
cd "$(dirname "$0")"
if lsof -i :8420 >/dev/null 2>&1; then
    open "http://localhost:8420"
else
    python3 server.py
fi
