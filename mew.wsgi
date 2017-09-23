import sys
import os
sys.path.insert(0, '/var/www/mew/')
os.environ['MEW_PATH'] = '/var/www/mew/'
from server import app as application
