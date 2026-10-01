SIMPLIFIED WHAT-IF SIMULATOR

Extract this ZIP, open carbon_frontend_final, then double-click START_SIMPLE.bat.
Open http://127.0.0.1:8000/ and sign up or log in.
Stop any previously running server first with Ctrl+C.

VS Code terminal alternative (inside carbon_frontend_final):
py -m pip install -r requirements.txt
py manage_simple.py migrate
py manage_simple.py runserver

Use START_SIMPLE.bat or manage_simple.py for this version.
The older launchers still open the older versions because no existing file
has been edited or deleted. All additions are in simple_simulator/ plus
these three new root files.

THE SIMULATOR
1. Enter monthly activity in the calculator.
2. Enter how many km of driving you will replace with walking/cycling.
3. Enter electricity units you will save (1 unit = 1 kWh).
4. Enter how many fewer new items you will buy (whole numbers).
5. Optionally choose a different diet.
6. Click See my savings. Read before, after, and CO2e saved per month.
Use 0 to leave an activity unchanged. Reset changes returns to zero.
There are no percentage controls, goals, presets, comparisons or exports
in the simplified simulator. The rest of the website is retained.

Example: 300 km, 100 electricity units, vegetarian diet, 2 purchases.
Replace 60 km, save 10 units, buy 1 fewer item, keep the diet.
Before: 254 kg. After: 221.2 kg. Saved: 32.8 kg CO2e per month.
Remaining activity: 240 km, 90 units and 1 item per month.

Limits are checked in both the browser and server. No reduction can exceed
its baseline. Lowering your baseline may require lowering your scenario
amounts; errors explain what to enter. See my savings and Save snapshot
recalculate the latest monthly inputs. Results remain illustrative demos.

Login, signup, glossy styling and account history use the previous upgrade.
The same upgrade_accounts.sqlite3 is used; existing saved records remain.
If you move to a new extracted folder and want your existing accounts,
stop the server and copy your upgrade_accounts.sqlite3 into that folder.
Your original MySQL settings and files remain unchanged.

Tests: py manage_simple.py test simple_simulator
