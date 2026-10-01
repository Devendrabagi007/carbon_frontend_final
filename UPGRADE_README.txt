CARBON CALCULATOR — GLOSS & ACCOUNTS UPGRADE

QUICK START (WINDOWS)
1. Extract the entire ZIP. Open the carbon_frontend_final folder.
2. Double-click START_UPGRADED.bat.
3. Open http://127.0.0.1:8000/ in your browser.
4. Choose Sign up, create an account, and you will enter the website.
   Later, use your username and password on the login page.

VS CODE / POWERSHELL ALTERNATIVE
Open the folder containing manage_upgraded.py in VS Code.
In its terminal, run these commands one at a time:

py -m pip install -r requirements.txt
py manage_upgraded.py migrate
py manage_upgraded.py runserver

Do not open the HTML template directly. Django serves the login, signup,
and dashboard pages. Use manage_upgraded.py for the upgraded website.
The original manage.py and preview.html still run/show the original version.
The bundled old .venv is preserved, but may reference a different PC; the
commands above use your installed Python instead. Internet is needed to
install any missing dependencies. Python 3.10 or later is required.

WHAT IS NEW
- Responsive glossy green interface with translucent cards and gradients.
- Login and sign-up pages, show/hide password, and clear form errors.
- Real Django accounts with hashed passwords, sessions, CSRF protection,
  password validation, login/signup throttling, and POST-only logout.
- Signup/login redirect to the dashboard; guests redirect to login.
- Private account-based snapshots, including the expanded scenario.
- Walking/cycling, reduced electricity, renewable electricity share,
  fewer purchases and alternative-diet What-If controls.
- Three scenario presets, annual savings and category breakdown.
- Reduction-goal tracker, comparison of up to three scenarios and CSV export.
- All scenario factors remain explicitly labelled illustrative demo values.

YOUR EXISTING FILES AND DATABASE
Every original ZIP entry is preserved at its original path, byte for byte.
Only new files were added. The upgrade/ folder is an independent extension;
manage_upgraded.py selects its settings, templates, routes and scripts.
Original config, .env, MySQL code, SQL, requirements, preview and virtual
environment files are not edited or removed.

The upgraded launcher creates upgrade_accounts.sqlite3 alongside manage.py.
It stores NEW accounts and their NEW enhanced snapshots in SQLite. It does
not connect to or change your original MySQL history. Old MySQL snapshots
are not automatically imported or displayed in the upgraded dashboard.
Your original project remains available through manage.py with its existing
MySQL setup. Both versions use port 8000 by default; run only one at a time.
To preserve upgraded accounts on another PC, copy upgrade_accounts.sqlite3
while the server is stopped. No test accounts or test database are included.

SCENARIO NOTES
Click Calculate after changing activity inputs. The What-If controls,
comparisons and CSV use the last calculated baseline. Save snapshot also
recalculates current activity inputs first. Comparison cards last only until
page reload; snapshots persist under your account. Up to 50 latest snapshots
are displayed. Clear saved snapshots deletes only the logged-in user's rows.
Renewable electricity is applied AFTER reducing electricity consumption.
Annual savings assume the same monthly activity and changes for 12 months.
A higher-impact diet can increase emissions; this is shown as an increase.
CSV export includes the baseline, the scenario settings, and the result.

LOCAL DEMO SCOPE
Email is stored as contact information; it is not verified and email login,
password reset by email, and social login are not included. Accounts use a
username. Login/signup attempts are limited to 10 failures per client address
per 10 minutes. The app is intended to run locally using Django runserver.

CHECKS
Django system checks and regression tests are included. To run them:
py manage_upgraded.py test upgrade
