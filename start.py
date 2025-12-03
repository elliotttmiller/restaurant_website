#!/usr/bin/env python3
"""
start.py (root wrapper)

Starts the backend server, ensures backend health, optionally starts ngrok, and serves the frontend static site
from `frontend/public/` so the frontend layout and asset paths remain unchanged.

This mirrors the behavior of `backend/src/app.py` but serves the static site from the new location
and defaults to starting the backend at `node backend/server.js`.
"""
from __future__ import annotations

import http.server
import socketserver
import os
import subprocess
import threading
import time
import shutil
import sys

def load_dotenv_file(path='.env'):
    """Lightweight .env loader that doesn't require external packages.
    It sets environment variables for lines like KEY=VALUE, skipping comments.
    """
    try:
        # Read all lines first so we can support simple ${VAR} expansion
        parsed = {}
        with open(path, 'r', encoding='utf-8') as f:
            for raw in f:
                line = raw.strip()
                if not line or line.startswith('#'):
                    continue
                if '=' in line:
                    key, val = line.split('=', 1)
                    key = key.strip()
                    val = val.strip().strip('"')
                    parsed[key] = val

        # Perform a simple ${VAR} expansion using already-parsed values and existing env
        import re
        var_re = re.compile(r"\$\{([^}]+)\}")
        def expand(val):
            if not isinstance(val, str):
                return val
            def repl(m):
                name = m.group(1)
                return parsed.get(name) or os.environ.get(name) or ''
            return var_re.sub(repl, val)

        for k, v in parsed.items():
            final = expand(v)
            # Only set if not already set in environment
            if k not in os.environ:
                os.environ[k] = final
    except FileNotFoundError:
        pass

# Load environment variables from .env
load_dotenv_file()

# Config defaults
ROOT = os.path.dirname(os.path.abspath(__file__))
FRONTEND_PUBLIC = os.path.join(ROOT, 'frontend', 'public')
PORT = int(os.getenv('PORT', os.getenv('STATIC_PORT', 8000)))
BACKEND_PORT = int(os.getenv('BACKEND_PORT', 3000))
BACKEND_HEALTH = os.getenv('BACKEND_HEALTH_PATH', '/api/health')
BACKEND_START_CMD = os.getenv('BACKEND_START_CMD', 'node backend/server.js')
NGROK_API_URL = os.getenv('NGROK_API_URL', 'http://127.0.0.1:4040/api/tunnels')


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=FRONTEND_PUBLIC, **kwargs)


def stream_process_output(proc, name):
    def _stream(stream, out):
        for line in iter(stream.readline, b""):
            try:
                out.write(f"[{name}] {line.decode(errors='replace')}")
                out.flush()
            except Exception:
                pass

    t1 = threading.Thread(target=_stream, args=(proc.stdout, sys.stdout), daemon=True)
    t2 = threading.Thread(target=_stream, args=(proc.stderr, sys.stderr), daemon=True)
    t1.start()
    t2.start()
    return (t1, t2)


def kill_process_on_port(port):
    try:
        port = int(port)
    except Exception:
        return

    print(f"Checking for processes listening on port {port}...")
    if os.name == 'nt':
        try:
            out = subprocess.check_output(['netstat', '-ano'], universal_newlines=True)
            lines = out.splitlines()
            pids_to_kill = set()
            for line in lines:
                parts = line.split()
                if len(parts) >= 5 and parts[0].lower().startswith('tcp'):
                    local = parts[1]
                    pid = parts[-1]
                    if local.endswith(f':{port}'):
                        try:
                            pid_int = int(pid)
                        except Exception:
                            continue
                        if pid_int <= 4:
                            continue
                        pids_to_kill.add(str(pid_int))

            if not pids_to_kill:
                print(f"No non-system processes found listening on port {port} to kill.")
            for pid in pids_to_kill:
                try:
                    print(f"Killing PID {pid} listening on port {port}")
                    subprocess.check_call(['taskkill', '/F', '/PID', str(pid)])
                except Exception as e:
                    print(f"Failed to kill PID {pid}: {e}")
        except Exception as e:
            print(f"Failed to inspect netstat output: {e}")
        return

    # Unix-like
    try:
        lsof = shutil.which('lsof')
        if lsof:
            out = subprocess.check_output([lsof, '-ti', f'tcp:{port}'], universal_newlines=True)
            pids = [p.strip() for p in out.splitlines() if p.strip()]
            for pid in pids:
                try:
                    print(f"Killing PID {pid} listening on port {port}")
                    os.kill(int(pid), 9)
                except Exception as e:
                    print(f"Failed to kill PID {pid}: {e}")
            return
    except Exception:
        pass

    try:
        fuser = shutil.which('fuser')
        if fuser:
            subprocess.call([fuser, '-k', f'{port}/tcp'])
            return
    except Exception:
        pass

    print(f"No helper found to kill processes on port {port}; skipping kill step.")


def wait_for_backend(timeout=15):
    """Wait for backend health endpoint using only the Python standard library."""
    import urllib.request
    import urllib.error

    url = f"http://127.0.0.1:{BACKEND_PORT}{BACKEND_HEALTH}"
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=1) as resp:
                if resp.status == 200:
                    print(f"Backend healthy at {url}")
                    return
        except Exception:
            pass
        time.sleep(0.5)
    raise RuntimeError(f"Backend did not become healthy at {url} within {timeout}s")


def start_ngrok(port):
    ngrok_bin = shutil.which("ngrok")
    if not ngrok_bin:
        print("ngrok binary not found in PATH; skipping ngrok startup.")
        return None, None

    proc = subprocess.Popen([ngrok_bin, "http", str(port), "--log=stdout"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stream_process_output(proc, "ngrok")

    try:
        import requests
        deadline = time.time() + 10
        public_url = None
        while time.time() < deadline:
            try:
                resp = requests.get(NGROK_API_URL, timeout=1)
                data = resp.json()
                tunnels = data.get("tunnels", [])
                if tunnels:
                    public_url = tunnels[0].get("public_url")
                    break
            except Exception:
                pass
            time.sleep(0.5)
        if public_url:
            print(f"ngrok public URL: {public_url}")
        else:
            print("ngrok started but public URL not available yet (check ngrok dashboard http://127.0.0.1:4040)")
    except Exception:
        print("Started ngrok but couldn't query the local ngrok API (requests required).")
        public_url = None

    return proc, public_url


def main():
    # Ensure no existing backend is running on BACKEND_PORT
    try:
        kill_process_on_port(BACKEND_PORT)
    except Exception as e:
        print(f"Warning: failed to kill existing process on port {BACKEND_PORT}: {e}")

    # Start backend
    print("Starting backend server...")
    backend_cmd = BACKEND_START_CMD.split()
    # Ensure the backend process uses BACKEND_PORT by setting PORT in its environment
    env = os.environ.copy()
    env['PORT'] = str(BACKEND_PORT)
    backend_proc = subprocess.Popen(backend_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=False, env=env)
    stream_process_output(backend_proc, "backend")

    try:
        wait_for_backend(timeout=20)
    except Exception as e:
        print(f"Error waiting for backend: {e}")
        backend_proc.terminate()
        backend_proc.wait()
        raise

    # Start ngrok tunnelling the backend port so the public URL maps to the Node backend
    # This makes it simple to test webhooks and API calls from Square (they need a public HTTPS URL
    # that points to your backend). The static site is still served locally at PORT.
    ngrok_proc, ngrok_url = start_ngrok(BACKEND_PORT)

    # Start static file server from frontend/public
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"Serving static site at http://localhost:{PORT} (CTRL+C to stop)")
            if ngrok_url:
                # ngrok public URL maps to the backend. Use this for webhook configuration
                # (e.g. https://<ngrok>/square/webhooks) or for testing API calls from remote services.
                print(f"Public backend (ngrok) -> {ngrok_url}/  (for webhooks and API testing)")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        try:
            if backend_proc and backend_proc.poll() is None:
                backend_proc.terminate()
                backend_proc.wait(timeout=5)
                print("Backend stopped.")
        except Exception:
            pass

        if ngrok_proc:
            try:
                if ngrok_proc.poll() is None:
                    ngrok_proc.terminate()
                    ngrok_proc.wait(timeout=5)
                    print("ngrok stopped.")
            except Exception:
                pass


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"Fatal error in start script: {e}")
        sys.exit(1)
