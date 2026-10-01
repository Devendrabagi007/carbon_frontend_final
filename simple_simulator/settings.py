from upgrade.settings import *
INSTALLED_APPS = ['simple_simulator'] + INSTALLED_APPS
ROOT_URLCONF = 'simple_simulator.urls'
WSGI_APPLICATION = 'simple_simulator.wsgi.application'
