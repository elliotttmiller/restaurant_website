import http.server
import socketserver
import os
import subprocess
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

PORT = int(os.getenv("PORT", 8000))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

if __name__ == "__main__":
    # Start the Square demo server
    square_server_process = subprocess.Popen(
        ["node", "api/server_example.js"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    print("Square demo server started (CTRL+C to stop both servers)")

    try:
        # Start the static file server
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"Serving at http://localhost:{PORT} (CTRL+C to stop)")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping servers...")
    finally:
        # Terminate the Square demo server
        square_server_process.terminate()
        square_server_process.wait()
        print("Square demo server stopped.")
