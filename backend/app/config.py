import os

MAX_UPLOAD_MB = int(os.environ.get("MAX_UPLOAD_MB", "100"))
SESSION_TTL_MINUTES = int(os.environ.get("SESSION_TTL_MINUTES", "30"))
MAX_FILES_PER_UPLOAD = int(os.environ.get("MAX_FILES_PER_UPLOAD", "50"))
SESSIONS_DIR = "/tmp/sessions"
PREVIEWS_DIR = "/tmp/previews"
