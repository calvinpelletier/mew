# Goofy pycharm workaround
# see https://stackoverflow.com/questions/38569992/pycharm-import-runtimewarning-after-updating-to-2016-2
from __future__ import absolute_import

import calendar
import datetime
import logging.config
import unittest
from json import loads, dumps

import pytz

from test.common import TestBase

logging.config.fileConfig("config/test_log.conf")
lg = logging.getLogger("test")


class TestMain(TestBase):
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

        rv = self.app.post('/api/bargraph', data=dumps(post_data), headers={"content-type": "application/json"})
        response_data = loads(rv.data)
        self.assertTrue(response_data["success"])
        for domain in ['test.com', 'test2.com', 'other']:
            self.assertIn(domain, response_data['labels'])
        self.assertEqual(len(response_data['values']), 3)

    def test_no_bg_data(self):
        self._gen_token()
        self._post_10_events()
        post_data = {
            "minutes": 5,
            "max_sites": 2
        }

        rv = self.app.post('/api/bargraph', data=dumps(post_data), headers={"content-type": "application/json"})
        response_data = loads(rv.data)
        self.assertTrue(response_data["success"])
        self.assertEqual(response_data['labels'], [])
        self.assertEqual(response_data['values'], [])
        self.assertEqual(response_data['total'], 0)

    def test_streak(self):
        self._gen_token()
        self.tz = 'America/Chicago'
        self.today = calendar.timegm(datetime.datetime.now(pytz.timezone(self.tz)).date().timetuple())

        # no quota
        self._set_day_usage(0, 5)
        streak = self._post('/api/getstreak', {'timezone': self.tz})['streak']
        self.assertEqual(streak, -1)

        # run all tests twice, once with all, once with unprod only
        for quota_type in ['all', 'unprod']:
            self._post('/api/quota', {'quota': 10, 'quota_type': quota_type, 'quota_unit': 'minutes'})

            if quota_type == 'unprod':
                self._post('/api/unprodsites', {'sites': ['test.com'], 'timezone': self.tz})

                # test no unprod usage
                self._clear_events()
                self._set_day_usage(0, 15, site='productive.com')
                self._set_day_usage(1, 15, site='productive.com')
                streak = self._post('/api/getstreak', {'timezone': self.tz})['streak']
                self.assertEqual(streak, 1)

            # less than one day of data
            self._clear_events()
            self._set_day_usage(0, 5)
            streak = self._post('/api/getstreak', {'timezone': self.tz})['streak']
            self.assertEqual(streak, 0)

            # below quota every day
            self._clear_events()
            self._set_day_usage(0, 5)
            self._set_day_usage(1, 5)
            self._set_day_usage(2, 5)
            self._set_day_usage(3, 5)
            streak = self._post('/api/getstreak', {'timezone': self.tz})['streak']
            self.assertEqual(streak, 3)

            # above quota today
            self._clear_events()
            self._set_day_usage(0, 15)
            self._set_day_usage(1, 5)
            streak = self._post('/api/getstreak', {'timezone': self.tz})['streak']
            self.assertEqual(streak, 0)

            # above quota two days ago
            self._clear_events()
            self._set_day_usage(0, 5)
            self._set_day_usage(1, 5)
            self._set_day_usage(2, 15)
            self._set_day_usage(3, 5)
            streak = self._post('/api/getstreak', {'timezone': self.tz})['streak']
            self.assertEqual(streak, 1)

            # no usage for the last few days
            self._clear_events()
            self._set_day_usage(3, 5)
            self._set_day_usage(4, 15)
            self._set_day_usage(5, 5)
            streak = self._post('/api/getstreak', {'timezone': self.tz})['streak']
            self.assertEqual(streak, 3)

            # quota of zero (valid)
            self._post('/api/quota', {'quota': 0, 'quota_type': quota_type, 'quota_unit': 'minutes'})

            # at quota for a few days
            self._clear_events()
            self._set_day_usage(3, 5)
            self._set_day_usage(5, 5)
            streak = self._post('/api/getstreak', {'timezone': self.tz})['streak']
            self.assertEqual(streak, 2)


if __name__ == '__main__':
    unittest.main()
