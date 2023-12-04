import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv(".env")

MODE = os.environ.get("MODE", "development")
DEBUG = os.environ.get("DEBUG", False)

URL = os.environ.get("URL")

SQLALCHEMY_ECHO = False
SQLALCHEMY_TRACK_MODIFICATIONS = False
SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URI")

REDIS_URI = os.environ.get("REDIS_URI")

JWT_ACCESS_COOKIE_NAME = "party_invite"
JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=30)
JWT_TOKEN_LOCATION = ["cookies"]
JWT_COOKIE_DOMAIN = "duckbo.at" if MODE == "production" else "localhost"
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "ssh")
JWT_COOKIE_SECURE = MODE == "production"

CACHE_TYPE = "RedisCache"
CACHE_REDIS_URL = REDIS_URI
