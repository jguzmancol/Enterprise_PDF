import os

MAX_UPLOAD_MB = int(os.environ.get("MAX_UPLOAD_MB", "100"))
SESSION_TTL_MINUTES = int(os.environ.get("SESSION_TTL_MINUTES", "30"))
MAX_FILES_PER_UPLOAD = int(os.environ.get("MAX_FILES_PER_UPLOAD", "50"))
CONVERT_TIMEOUT_SECONDS = int(os.environ.get("CONVERT_TIMEOUT_SECONDS", "240"))
MAX_CONVERT_PAGES = int(os.environ.get("MAX_CONVERT_PAGES", "150"))
SESSIONS_DIR = "/tmp/sessions"
PREVIEWS_DIR = "/tmp/previews"
