# Goofy pycharm workaround
# see https://stackoverflow.com/questions/38569992/pycharm-import-runtimewarning-after-updating-to-2016-2
from __future__ import absolute_import

import datetime
import logging.config
import os
import shutil
import sqlite3
import tempfile
import time
import unittest
from json import loads, dumps

import pytz

import main

logging.config.fileConfig("config/test_log.conf")
lg = logging.getLogger("test")


class TestBase(unittest.TestCase):
    tmp_dir = None

    def setUp(self):
        self.tmp_dir = tempfile.mkdtemp(prefix="mewtest_")
        lg.info("Created testing directory in %s" % self.tmp_dir)
        self.db_path = os.path.join(self.tmp_dir, "test.db")
        os.environ["MEW_DB_PATH"] = self.db_path

        # Initialize the DB
        init_qry = open('../db/init.sql', 'r').read()
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.executescript(init_qry)
        conn.commit()
        c.close()

        lg.info("Initialized DB at %s" % self.db_path)
        conn.close()

        main.setup()

        main.app.testing = True
        main.app.config['SERVER_NAME'] = 'localhost'
        self.app = main.app.test_client()

    def tearDown(self):
        shutil.rmtree(self.tmp_dir)
        lg.info("Cleaned up testing directory at %s", self.tmp_dir)

    def _post_10_events(self):
        # Add ~10 events
        domains = ["test.com", "test2.com"]
        domain_idx = 0
        now = int(time.time()) * 1000
        # Note - last 5 or so minutes will be clear of activity
        _5min = 1000 * 60 * 5
        for timestamp in range(now - 1000000 - _5min, now - _5min, 100000):
            post_data = {
                "token": 1111,
                "hostname": domains[domain_idx],
                "time": timestamp
            }
            domain_idx = (domain_idx + 1) % 2

            rv = self.app.post('/api/addevent', data=dumps(post_data), headers={"content-type": "application/json"})
            self.assertEqual(rv.status_code, 200, msg="Received %d response from /api/addevent" % rv.status_code)
            lg.debug("Received 200 response from /api/addevent")

    def _gen_token(self):
        rv = self.app.post('/api/gentoken')
        response_data = loads(rv.data)
        self.assertTrue(response_data["success"])
        self.assertEqual(len(response_data["token"]), 32)

        self.token = response_data["token"]
        lg.debug("Generated token %s", self.token)
        self.uid = 1

        with self.app.session_transaction() as sess:
            sess['uid'] = self.uid

    def _post(self, api, data):
        resp = self.app.post(api, data=dumps(data), headers={"content-type": "application/json"}).data
        resp_json = None
        try:
            resp_json = loads(resp)
        except:
            return resp
        self.assertTrue(resp_json['success'])
        return resp_json

    def _clear_events(self):
        db = sqlite3.connect(self.db_path)
        c = db.cursor()
        c.execute('DELETE FROM events WHERE uid = ?', (self.uid,))
        c.execute('DELETE FROM daily_summary_cache WHERE uid = ?', (self.uid,))
        db.commit()
        c.close()
        db.close()

    # usage in minutes
    def _set_day_usage(self, days_ago, usage, site='test.com'):
        db = sqlite3.connect(self.db_path)
        c = db.cursor()

        local_day = time.mktime(datetime.datetime.now(pytz.timezone(self.tz)).date().timetuple())
        c.execute('INSERT INTO events VALUES (?, ?, ?)', (self.uid, site, (local_day - days_ago * 86400) * 1000))
        c.execute('INSERT INTO events VALUES (?, ?, ?)',
                  (self.uid, None, (local_day - days_ago * 86400 + usage * 60) * 1000))

        db.commit()
        c.close()
        db.close()
