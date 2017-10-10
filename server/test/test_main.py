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
from json import loads, dumps

from server import main

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


if __name__ == '__main__':
    unittest.main()
