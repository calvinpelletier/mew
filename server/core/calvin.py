# this is a backdoor I'm using to get my reddit usage

import datetime
import sqlite3
from os import environ
import event_analysis
import concurrency
import log

concurrency.init()
log.init_loggers('/var/www/mew/')
db = sqlite3.connect('/var/www/mew/db/prod.db')

data = event_analysis.get_daily_summary(db, 4, 'America/Los_Angeles')['data']
with open('/tmp/calvin_reddit.csv', 'w') as f:
    for day in data:
        date = datetime.datetime.utcfromtimestamp(day['date']).date().isoformat()
        usage = int(day['summary']['reddit.com']) if 'reddit.com' in day['summary'] else 0
        f.write('{},{}\n'.format(date, usage))
