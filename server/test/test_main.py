# Goofy pycharm workaround
# see https://stackoverflow.com/questions/38569992/pycharm-import-runtimewarning-after-updating-to-2016-2
from __future__ import absolute_import

import os
import shutil
import sqlite3
import logging.config
import tempfile
import unittest
from json import loads, dumps

from mew_server import main

logging.config.fileConfig("config/logging.conf")
lg = logging.getLogger("test")


class TestMain(unittest.TestCase):
    tmp_dir = None

    def setUp(self):
        # self.db_fd, main.app.config['DATABASE'] = tempfile.mkstemp()
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

        main.app.testing = True
        main.setup()
        self.app = main.app.test_client()

    def tearDown(self):
        shutil.rmtree(self.tmp_dir)

    def test_gen_token(self):
        rv = self.app.post('/api/gentoken')
        response_data = loads(rv.data)
        self.assertTrue(response_data["success"])
        self.assertIsNotNone(response_data["token"])

    def test_addevent(self):
        post_data = {
            "token": 1111,
            "hostname": "test.com",
            "time": 1505682964
        }
        rv = self.app.post('/api/addevent', data=dumps(post_data), headers={"content-type": "application/json"})
        self.assertEqual(rv.status_code, 200)


if __name__ == '__main__':
    unittest.main()
