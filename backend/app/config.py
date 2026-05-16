import os

MAX_UPLOAD_MB = int(os.environ.get("MAX_UPLOAD_MB", "100"))
SESSION_TTL_MINUTES = int(os.environ.get("SESSION_TTL_MINUTES", "30"))
SESSIONS_DIR = "/tmp/sessions"
PREVIEWS_DIR = "/tmp/previews"
