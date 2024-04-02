from datetime import timedelta
import pathlib

APPLICATION_ROOT = '/'

COMPANN_ROOT = pathlib.Path(__file__).resolve().parent.parent
UPLOAD_FOLDER = COMPANN_ROOT/'var'/'uploads'
UPLOAD_FOLDER_TMP = COMPANN_ROOT/'var'/'uploads'/'tmp'
ALLOWED_EXTENSIONS = set(['json'])

MAX_CONTENT_LENGTH = 1024 * 1024 * 1024 * 1024
MIN_SEG_LEN = 50
MAX_SEG_LEN = 150

# PASSWORD_REGEX = "^(.{0,7}|[^0-9]*|[^A-Z]*|[^a-z]*|[a-zA-Z0-9]*)$"
PASSWORD_REGEX = ".{4,}"
PASSWORD_MESSAGE = "Password must be at least 4 characters."
JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)

# similarity parameters
ALPHA = 1 # weight for temporal mismatches
BETA = 1 # weight for categorical mismatches
CAL_TIMES = 10 # the number of times that the agreement score should be calculated for a text

DATABASE_FILENAME = COMPANN_ROOT/'var'/'compAnn.sqlite3'
