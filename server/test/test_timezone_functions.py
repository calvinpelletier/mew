# Goofy pycharm workaround
# see https://stackoverflow.com/questions/38569992/pycharm-import-runtimewarning-after-updating-to-2016-2
from __future__ import absolute_import

import datetime
import logging
import unittest

import pytz

from core.timezones import *

_1hr = 3600
_1day = _1hr * 24

feb_1_2017_utc = 1485907200
apr_1_2017_utc = 1491004800

logging.config.fileConfig("config/test_log.conf")
lg = logging.getLogger("test")


class TestTZFunctions(unittest.TestCase):
    def _assert_two_way_conversion(self, curr_day, tz_obj, hour_diff):
        utc_date = datetime.datetime.utcfromtimestamp(curr_day)
        result = local_unixdate_from_utc_unixdate(tz_obj, utc_date)
        self.assertEqual(result, curr_day + hour_diff * _1hr)
        reverse_curr_day = local_unixdate_from_utc_unixdate(pytz.utc, datetime.datetime.utcfromtimestamp(result))
        self.assertEqual(reverse_curr_day, curr_day)

    def test_utc_date_to_user_tz_date(self):
        tz_obj = pytz.timezone("America/Chicago")

        # For thirty days starting on feb 1st, assert 6 hour difference
        curr_day = feb_1_2017_utc
        for _ in range(30):
            self._assert_two_way_conversion(curr_day, tz_obj, 6)
            curr_day += _1day

        # For thirty days starting on apr 1st, assert 5 hour difference (DST)
        curr_day = apr_1_2017_utc
        for _ in range(30):
            self._assert_two_way_conversion(curr_day, tz_obj, 5)
            curr_day += _1day

        tz_obj = pytz.timezone("America/New_York")

        # For thirty days starting on feb 1st, assert 5 hour difference
        curr_day = feb_1_2017_utc
        for _ in range(30):
            self._assert_two_way_conversion(curr_day, tz_obj, 5)
            curr_day += _1day

        # For thirty days starting on apr 1st, assert 4 hour difference (DST)
        curr_day = apr_1_2017_utc
        for _ in range(30):
            self._assert_two_way_conversion(curr_day, tz_obj, 4)
            curr_day += _1day

    def test_unixdate_for_local_time(self):
        tz_obj = pytz.timezone("America/New_York")

        # input:
        #   3 am feb 2nd, utc
        # result should be:
        #   midnight, feb 1st, utc
        #   (because the user's local time is 10pm feb 1st)
        curr_day = feb_1_2017_utc + _1day + 3 * _1hr
        result = get_unixdate_for_local_time(tz_obj, curr_day)
        self.assertEqual(result, feb_1_2017_utc)

        # input:
        #   6 am feb 2nd, utc
        # result should be:
        #   midnight, feb 2nd, utc
        #   (because the user's local time is 10pm feb 1st)
        curr_day = feb_1_2017_utc + _1day + 6 * _1hr
        result = get_unixdate_for_local_time(tz_obj, curr_day)
        self.assertEqual(result, feb_1_2017_utc + _1day)
