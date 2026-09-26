"""
Lightweight Static Server for Ladakh Innovations Portfolio
Runs on Python 3.11 with zero dependencies.
Usage:
    python serve.py
"""

import http.server
import socketserver
import webbrowser
import os
import sys

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def run():
    os.chdir(DIRECTORY)
    # Allow port reuse in case server was recently closed
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}"
        print("=" * 60)
        print(" [LADAKH ENGINEERING INNOVATIONS PORTFOLIO]")
        print(f" Server running at: {url}")
        print(f" Serving from:     {DIRECTORY}")
        print(" Press Ctrl+C to stop server")
        print("=" * 60)
        try:
            webbrowser.open(url)
        except Exception:
            pass
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped gracefully.")

if __name__ == "__main__":
    run()
