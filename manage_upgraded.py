"""Run the additive upgrade without modifying the original project."""
import os
import sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'upgrade.settings')
from django.core.management import execute_from_command_line
execute_from_command_line(sys.argv)
