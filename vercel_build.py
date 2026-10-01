"""Create/update database tables during the explicitly configured Vercel build."""
import os
import subprocess
import sys

if __name__ == "__main__":
    os.environ["DJANGO_SETTINGS_MODULE"] = "vercel_app.settings"
    subprocess.run([sys.executable, "manage.py", "check"], check=True)
    subprocess.run([sys.executable, "manage.py", "migrate", "--noinput"], check=True)
    # Vercel's Django integration automatically runs collectstatic.

