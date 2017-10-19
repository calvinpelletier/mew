# Goofy pycharm workaround
# see https://stackoverflow.com/questions/38569992/pycharm-import-runtimewarning-after-updating-to-2016-2
from __future__ import absolute_import

import logging.config
import os
import shutil
import sqlite3
import tempfile
import time
import unittest
import calendar
import datetime
import pytz
from json import loads, dumps

import main

logging.config.fileConfig("config/logging.conf")
lg = logging.getLogger("test")

class TestMain(unittest.TestCase):
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
        for timestamp in range(now - 1000000, now, 100000):
            post_data = {
                "token": 1111,
                "hostname": domains[domain_idx],
                "time": timestamp
            }
            domain_idx = (domain_idx + 1) % 2

            with self.app.session_transaction() as sess:
                sess['uid'] = self.uid
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

    def _post(self, api, data):
        resp = loads(self.app.post(api, data=dumps(data), headers={"content-type": "application/json"}).data)
        self.assertTrue(resp['success'])
        return resp

    def _set_streak_cache(self, streak, days_ago):
        if streak is None or days_ago is None:
            streak = 0
            last_updated = 0
        else:
            last_updated = self.today - days_ago * 86400

        db = sqlite3.connect(self.db_path)
        c = db.cursor()
        c.execute('SELECT quota, quota_type, tz FROM quotas WHERE uid = ?', (self.uid,))
        result = c.fetchone()
        if result is None:
            result = (0, 0, None)
        c.execute('INSERT OR REPLACE INTO quotas VALUES (?, ?, ?, ?, ?, ?)',
            (self.uid, result[0], result[1], streak, last_updated, result[2]))
        db.commit()
        c.close()
        db.close()

    def _clear_events(self):
        db = sqlite3.connect(self.db_path)
        c = db.cursor()
        c.execute('DELETE FROM events WHERE uid = ?', (self.uid,))
        c.execute('DELETE FROM daily_summary_cache WHERE uid = ?', (self.uid,))
        db.commit()
        c.close()
        db.close()

    # usage in minutes
    def _set_day_usage(self, days_ago, usage):
        db = sqlite3.connect(self.db_path)
        c = db.cursor()

        c.execute('INSERT INTO events VALUES (?, ?, ?)', (self.uid, 'test.com', (self.today - days_ago * 86400) * 1000))
        c.execute('INSERT INTO events VALUES (?, ?, ?)', (self.uid, None, (self.today - days_ago * 86400 + usage * 60) * 1000))

        db.commit()
        c.close()
        db.close()

    def test_gen_token(self):
        self._gen_token()

    def test_addevent(self):
        self._gen_token()
        self._post_10_events()

    def test_bar_graph_data(self):
        self._gen_token()
        self._post_10_events()
        post_data = {
            "minutes": 20000,
            "max_sites": 2
        }

        with self.app.session_transaction() as sess:
            sess['uid'] = self.uid

        rv = self.app.post('/api/bargraph', data=dumps(post_data), headers={"content-type": "application/json"})
        response_data = loads(rv.data)
        self.assertTrue(response_data["success"])
        for domain in ['test.com', 'test2.com', 'other']:
            self.assertIn(domain, response_data['labels'])
        self.assertEqual(len(response_data['values']), 3)

    def test_streak(self):
        self._gen_token()
        with self.app.session_transaction() as sess:
            sess['uid'] = self.uid
        self.tz = 'America/Chicago'
        self.today = calendar.timegm(datetime.datetime.now(pytz.timezone(self.tz)).date().timetuple())

        # no quota
        self._set_day_usage(0, 5)
        streak = self._post('/api/getstreak', {'timezone': self.tz})['streak']
        self.assertEqual(streak, -1)

        # run all tests twice, once with all, once with unprod only
        for quota_type in ['all', 'unprod']:
            if quota_type == 'unprod':
                print 'AYYYYY'
                self._post('/api/unprodsites', {'sites': ['test.com']})
            self._post('/api/quota', {'quota': 10, 'quota_type': quota_type})
            self._clear_events()
            self._set_streak_cache(None, None)

            # less than one day of data
            self._set_day_usage(0, 5)
            streak = self._post('/api/getstreak', {'timezone': self.tz})['streak']
            self.assertEqual(streak, 0)

            # duplicate to check caching
            streak = self._post('/api/getstreak', {'timezone': self.tz})['streak']
            self.assertEqual(streak, 0)

            # below quota every day, no cache
            self._clear_events()
            self._set_streak_cache(None, None)
            self._set_day_usage(0, 5)
            self._set_day_usage(1, 5)
            self._set_day_usage(2, 5)
            self._set_day_usage(3, 5)
            streak = self._post('/api/getstreak', {'timezone': self.tz})['streak']
            self.assertEqual(streak, 3)

            # duplicate to check caching
            streak = self._post('/api/getstreak', {'timezone': self.tz})['streak']
            self.assertEqual(streak, 3)

            # below quota every day, cache first day
            self._set_streak_cache(0, 3)
            streak = self._post('/api/getstreak', {'timezone': self.tz})['streak']
            self.assertEqual(streak, 3)

            # below quota every day, cache in the middle
            self._set_streak_cache(2, 1)
            streak = self._post('/api/getstreak', {'timezone': self.tz})['streak']
            self.assertEqual(streak, 3)

            # above quota today
            self._clear_events()
            self._set_streak_cache(None, None)
            self._set_day_usage(0, 15)
            self._set_day_usage(1, 5)
            streak = self._post('/api/getstreak', {'timezone': self.tz})['streak']
            self.assertEqual(streak, 0)

            # duplicate to check caching
            streak = self._post('/api/getstreak', {'timezone': self.tz})['streak']
            self.assertEqual(streak, 0)

            # above quota two days ago, no cache
            self._clear_events()
            self._set_streak_cache(None, None)
            self._set_day_usage(0, 5)
            self._set_day_usage(1, 5)
            self._set_day_usage(2, 15)
            self._set_day_usage(3, 5)
            streak = self._post('/api/getstreak', {'timezone': self.tz})['streak']
            self.assertEqual(streak, 1)

            # above quota two days ago, cache two days ago
            self._set_streak_cache(1, 2)
            streak = self._post('/api/getstreak', {'timezone': self.tz})['streak']
            self.assertEqual(streak, 1)


if __name__ == '__main__':
    unittest.main()
