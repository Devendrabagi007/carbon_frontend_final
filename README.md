# Personal Carbon Calculator — Django + MySQL

This project contains a Django website for the Quantum Crew Personal Carbon Calculator. It calculates an illustrative monthly footprint in the browser and sends saved snapshots to MySQL through a Django API.

**The carbon factors are sample UI values, not verified emissions data.** A saved record is attached to a signed browser cookie. This starter does not have user accounts, so a different browser or cleared cookies will have separate history.

## 1. Create the local database in MySQL Workbench

1. Install and start MySQL Server, then open MySQL Workbench and connect to your local server as an administrator.
2. Open `sql/setup_database.sql` in Workbench.
3. In the SQL file, replace `REPLACE_WITH_A_STRONG_PASSWORD` with a password you choose. Remember it for your `.env` file.
4. Click the lightning bolt to execute the script. It creates the `carbon_calculator` database, the restricted `carbon_app` user, and the `carbon_snapshots` table.
5. Refresh the Schemas list. Expand `carbon_calculator` → `Tables` and confirm `carbon_snapshots` is present.

If you already created `carbon_app` with a different password, either use its existing password in `.env`, or change it in Workbench as an administrator:

```sql
ALTER USER 'carbon_app'@'localhost' IDENTIFIED BY 'your-new-password';
```

The app account has only `SELECT`, `INSERT`, and `DELETE` permission on this database. Run database setup as the administrator, not as `carbon_app`.

## 2. Run the website locally on Windows

Open the extracted `carbon_frontend` folder in VS Code. The terminal must be in this folder, where `manage.py` is located. Run these commands one at a time in PowerShell:

```powershell
py -m venv .venv
```

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Copy `.env.example` to a new file named `.env`. Edit `.env` and enter the same MySQL password you used in the SQL script. Generate a Django secret by running:

```powershell
.\.venv\Scripts\python.exe -c "import secrets; print(secrets.token_urlsafe(50))"
```

Paste the output into `DJANGO_SECRET_KEY` in `.env`. Leave `DJANGO_DEBUG=True` and `MYSQL_SSL=False` for the local MySQL Server. Do not upload `.env` to GitHub.

Start the site:

```powershell
.\.venv\Scripts\python.exe manage.py check
```

```powershell
.\.venv\Scripts\python.exe manage.py runserver
```

Open <http://127.0.0.1:8000/>. Do not open `preview.html` for this database test; it is a standalone visual preview. Change the inputs, click **Calculate**, then **Save snapshot**. The latest 12 records for this browser should appear in the history.

In Workbench, run:

```sql
USE carbon_calculator;
SELECT * FROM carbon_snapshots ORDER BY id DESC;
```

## 3. What changed in the code

- `calculator/db.py` opens a MySQL Connector/Python connection using environment variables and optional verified TLS.
- `calculator/views.py` validates the submitted inputs, recalculates the estimate on the server, inserts snapshots, returns the latest 12 records, and clears this browser's records.
- `calculator/static/calculator/app.js` calls the Django API for history, save, and clear actions. It no longer uses browser local storage for snapshots.
- `calculator/templates/calculator/index.html` now describes the MySQL-backed history and illustrative calculation factors.
- `config/wsgi.py` and `WSGI_APPLICATION` provide the Django entry point used by Vercel.
- `sql/setup_database.sql` contains the Workbench setup script.

The API uses parameterized SQL. The browser receives a signed visitor cookie so one visitor cannot list another visitor's snapshots just by changing a normal form value. Add login accounts before using this pattern for sensitive personal records.

## 4. Deploy using Vercel

Vercel hosts the Django application, but the production database must be reachable over the internet. A MySQL server running on your laptop is not reachable from Vercel using `localhost`. Create a hosted MySQL service with a provider such as Aiven or another MySQL host. Check its current plan and price before creating a service.

1. Create the hosted MySQL instance and copy its host, port, database, username, password, and public CA certificate details.
2. Connect to that hosted instance in Workbench using the provider's host/port and SSL instructions.
3. In the hosted database, create the `carbon_snapshots` table using the `CREATE TABLE` statement in `sql/setup_database.sql`. Use the database and username supplied by the hosting provider; do not create the local `carbon_app` account there unless the provider specifically supports it.
4. Test the remote database from your laptop first. Copy the provider's public CA certificate to `certs/mysql-ca.pem`, set `MYSQL_SSL=True` and `MYSQL_SSL_CA=certs/mysql-ca.pem` in `.env`, and replace the local connection fields with the hosted values. Add `certs/mysql-ca.pem` to GitHub if your provider requires it; a public CA certificate is not a password or private key. Never commit a private key or `.env`.
5. Save a snapshot locally and confirm it appears in Workbench connected to the hosted database.
6. Create a private GitHub repository. Upload the contents of `carbon_frontend` (so `manage.py` is at repository root). Include `.gitignore`, and exclude `.env`, `.venv`, `__pycache__`, and secrets.
7. In Vercel, choose **Add New → Project**, import the GitHub repository, and deploy. Vercel's Django support detects `manage.py`; `STATIC_ROOT` is configured so Django static assets can be collected for deployment.
8. In Vercel project settings, add these environment variables for Production (and Preview if you use preview deployments):

   - `DJANGO_SECRET_KEY`: generate a separate random value; do not reuse the local secret.
   - `DJANGO_DEBUG`: `False`
   - `DJANGO_ALLOWED_HOSTS`: your assigned Vercel hostname, without `https://` (for example `your-project.vercel.app`).
   - `DJANGO_CSRF_TRUSTED_ORIGINS`: full HTTPS origin (for example `https://your-project.vercel.app`).
   - `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`: hosted MySQL credentials.
   - `MYSQL_SSL`: `True`
   - `MYSQL_SSL_CA`: `certs/mysql-ca.pem` (or the relative path used for your CA file).

9. Redeploy after adding or changing environment variables. Open the Vercel site, save a snapshot, refresh, and confirm it remains in history. In Workbench, run `SELECT * FROM carbon_snapshots ORDER BY id DESC;` against the hosted connection.

If Vercel gives you a new hostname, update `DJANGO_ALLOWED_HOSTS` and `DJANGO_CSRF_TRUSTED_ORIGINS` with that exact hostname/origin and redeploy. Check Vercel's runtime logs for API errors; do not put database credentials in the browser or in JavaScript.

## Troubleshooting

- **`-m` is not recognized:** type the complete command beginning with `py` or `.\.venv\Scripts\python.exe`; `-m` by itself is not a command.
- **Access denied:** check MySQL username, password, selected database, and grants.
- **Can't connect / timeout:** confirm MySQL Server is running and the host and port are correct. For hosted MySQL, check network access rules and TLS requirements.
- **Unknown database or missing table:** select the same database that appears in `.env` or Vercel variables, then run the SQL setup there.
- **DisallowedHost:** correct `DJANGO_ALLOWED_HOSTS` for the active Vercel hostname.
- **CSRF error:** use the HTTPS Vercel site and set its exact origin in `DJANGO_CSRF_TRUSTED_ORIGINS`.
- **Page works but Save fails:** inspect the terminal while local, or Vercel runtime logs after deployment. The public page may load even if MySQL is unavailable.
