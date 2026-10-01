import os
from pathlib import Path

import mysql.connector
from django.conf import settings


def get_connection():
    options = {
        "host": os.environ["MYSQL_HOST"],
        "port": int(os.getenv("MYSQL_PORT", "3306")),
        "database": os.environ["MYSQL_DATABASE"],
        "user": os.environ["MYSQL_USER"],
        "password": os.environ["MYSQL_PASSWORD"],
        "connection_timeout": 10,
    }

    if os.getenv("MYSQL_SSL", "false").lower() == "true":
        ca_path = Path(os.environ["MYSQL_SSL_CA"])
        if not ca_path.is_absolute():
            ca_path = settings.BASE_DIR / ca_path
        options.update(
            ssl_disabled=False,
            ssl_verify_cert=True,
            ssl_verify_identity=True,
            ssl_ca=str(ca_path),
        )

    return mysql.connector.connect(**options)
