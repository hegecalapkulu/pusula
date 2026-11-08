#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Pusula — Sürdürülebilir Hayat & Hedef Planlayıcı
Yerel Veri Sunucusu (Verileri diskte data/planner_data.json altında güvenle saklar)
"""

import http.server
import json
import os
import shutil
import socketserver
import sys
import webbrowser
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
BACKUP_DIR = DATA_DIR / "backups"
DATA_FILE = DATA_DIR / "planner_data.json"
DEFAULT_PORT = 8420


def ensure_dirs():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)


class PlannerRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(BASE_DIR), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path.startswith("/api/data"):
            ensure_dirs()
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            if DATA_FILE.exists():
                try:
                    content = DATA_FILE.read_text(encoding="utf-8")
                    self.wfile.write(content.encode("utf-8"))
                    return
                except Exception as exc:
                    self.wfile.write(json.dumps({"error": str(exc)}).encode("utf-8"))
                    return
            else:
                self.wfile.write(json.dumps({"empty": True}).encode("utf-8"))
                return
        return super().do_GET()

    def do_POST(self):
        if self.path.startswith("/api/data"):
            ensure_dirs()
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                raw_body = self.rfile.read(content_length).decode("utf-8")
                parsed = json.loads(raw_body)

                # Günlük otomatik yedekleme (her gün için 1 yedek tutar, son 14 günü saklar)
                if DATA_FILE.exists():
                    today_tag = datetime.now().strftime("%Y-%m-%d")
                    backup_path = BACKUP_DIR / f"planner_backup_{today_tag}.json"
                    if not backup_path.exists():
                        shutil.copy2(DATA_FILE, backup_path)
                        backups = sorted(BACKUP_DIR.glob("planner_backup_*.json"))
                        while len(backups) > 14:
                            old = backups.pop(0)
                            old.unlink(missing_ok=True)

                DATA_FILE.write_text(
                    json.dumps(parsed, ensure_ascii=False, indent=2),
                    encoding="utf-8",
                )

                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(
                    json.dumps(
                        {
                            "ok": True,
                            "savedAt": datetime.now().isoformat(),
                            "file": str(DATA_FILE),
                        },
                        ensure_ascii=False,
                    ).encode("utf-8")
                )
            except Exception as exc:
                self.send_response(500)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(
                    json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False).encode("utf-8")
                )
            return

        self.send_response(404)
        self.end_headers()

    def log_message(self, format, *args):
        # Sessiz ve temiz terminal çıktısı
        pass


class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    allow_reuse_address = True


def run_server(port=DEFAULT_PORT, open_browser=True):
    ensure_dirs()
    server = ThreadedHTTPServer(("127.0.0.1", port), PlannerRequestHandler)
    url = f"http://localhost:{port}"
    print(f"====================================================")
    print(f" Pusula Hayat Planlayici Calisiyor!")
    print(f" Adres: {url}")
    print(f" Veri Dosyasi: {DATA_FILE}")
    print(f"====================================================")
    if open_browser:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nSunucu kapatiliyor...")
        server.server_close()


if __name__ == "__main__":
    no_browser = "--no-browser" in sys.argv
    port = DEFAULT_PORT
    for arg in sys.argv[1:]:
        if arg.startswith("--port="):
            port = int(arg.split("=", 1)[1])
    run_server(port=port, open_browser=not no_browser)
