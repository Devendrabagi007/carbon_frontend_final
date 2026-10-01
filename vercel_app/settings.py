"""Production settings; local launchers continue using their original settings."""
import os

from simple_simulator.settings import *
import dj_database_url

DEBUG = False
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "")
if len(SECRET_KEY) < 50 or SECRET_KEY == "local-development-only-change-me":
    raise RuntimeError("Set DJANGO_SECRET_KEY to a newly generated secret of at least 50 characters.")

database_url = os.environ.get("DATABASE_URL", "")
if not database_url.startswith(("postgres://", "postgresql://")):
    raise RuntimeError("Set DATABASE_URL to your hosted PostgreSQL connection URL.")
DATABASES = {"default": dj_database_url.parse(database_url, conn_max_age=0, ssl_require=True)}
DATABASES["default"]["DISABLE_SERVER_SIDE_CURSORS"] = True

ROOT_URLCONF = "simple_simulator.urls"
WSGI_APPLICATION = "vercel_app.wsgi.application"
ALLOWED_HOSTS = [host.strip() for host in os.getenv("DJANGO_ALLOWED_HOSTS", "").split(",") if host.strip()]
CSRF_TRUSTED_ORIGINS = [origin.strip().rstrip("/") for origin in os.getenv("DJANGO_CSRF_TRUSTED_ORIGINS", "").split(",") if origin.strip()]
for variable in ("VERCEL_URL", "VERCEL_PROJECT_PRODUCTION_URL", "VERCEL_BRANCH_URL"):
    host = os.getenv(variable, "").strip()
    if host:
        ALLOWED_HOSTS.append(host)
        CSRF_TRUSTED_ORIGINS.append("https://" + host)

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 3600

