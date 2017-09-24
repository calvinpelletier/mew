import sys
import os
sys.path.insert(0, '/var/www/mew/')
os.environ['MEW_PATH'] = '/var/www/mew/'
os.environ['MEW_DB_PATH'] = '/var/www/mew/db/prod.db'
from server.main import setup, app as application
setup()
