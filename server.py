#!/usr/bin/env python3
"""
로컬 개발 서버 — 존재하지 않는 경로 접근 시 404.html 반환
실행: python3 server.py
"""
from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

class Handler(SimpleHTTPRequestHandler):
    def send_error(self, code, message=None, explain=None):
        if code == 404:
            self.send_response(404)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            try:
                with open('404.html', 'rb') as f:
                    self.wfile.write(f.read())
            except FileNotFoundError:
                self.wfile.write(b'<h1>404 Not Found</h1>')
        else:
            super().send_error(code, message, explain)

    def log_message(self, fmt, *args):
        print(f'  {self.address_string()} — {fmt % args}')

os.chdir(os.path.dirname(os.path.abspath(__file__)))
port = 8080
print(f'Server running at http://localhost:{port}')
HTTPServer(('', port), Handler).serve_forever()
