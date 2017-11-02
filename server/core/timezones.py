import calendar
import datetime

import pytz

from log import *

DATE_FMT = "%Y-%m-%d %H:%M:%S"

"""
TERMINOLOGY
utc unixdate:
    unixtime for midnight on that date (utc)
    generally used for encoding dates (i.e. summary cache uses this to represent the day even though the day divisions are timezone dependent)
local unixdate:
    unixtime for midnight on that date according to a specific timezone
"""

def local_unixdate_from_utc_unixdate(tz_obj, utc_unixdate):
    """
    Takes a utc date, at midnight. (either a unixtime or actual datetime) Converts that into the same date, but in the
    users timezone, and returns the unixtime representation of that date.

    :param tz_obj: pytz timezone object, the user's timezone
    :param utc_unixdate: either a timezone-naive datetime object, or a unixtime. It's a UTC-based representation of the LOCAL
        date.

        Example:
            If the user's local date in question is 3/4/2017, regardless of timezone,
            this input will be 3/4/2017 00:00:00 in UTC.
    """

    if isinstance(utc_unixdate, datetime.datetime):
        pass
    elif type(utc_unixdate) == int:
        utc_unixdate = datetime.datetime.utcfromtimestamp(utc_unixdate)
    else:
        error("Invalid parameter type for utc_unixdate: ", type(utc_unixdate))
        return None

    loc_datetime = tz_obj.localize(datetime.datetime(utc_unixdate.year, utc_unixdate.month, utc_unixdate.day, 0, 0, 0, 0))
    loc_unixdate = calendar.timegm(loc_datetime.utctimetuple())
    return loc_unixdate


def get_unixdate_for_local_time(tz_obj, unixtime):
    """
    Takes a unixtime (could be anytime, not just midnight), converts into the user's timezone, and returns a unixtime
    representation of that date, but in UTC.

    Example:
        Input: tz_obj=EST, utc_unixtime=1485910800 (2/1/2017 at 1am, UTC)
        Output: Unixtime for 1/31/2017 at midnight, UTC. The user's date is actually on 1/31 (because they're in EST).

    :param tz_obj: pytz timezone object, the user's timezone
    :param unixtime: no special characteristics, just a UTC timestamp straight from the DB, in seconds.
    """
    first_timestamp = datetime.datetime.utcfromtimestamp(unixtime).replace(tzinfo=pytz.UTC).astimezone(tz_obj)
    return calendar.timegm(first_timestamp.date().timetuple())


def cur_unixdate_for_tz(tz_obj):
    """
    Returns current date (according to user's timezone) encoded as a unixdate
    """
    return calendar.timegm(datetime.datetime.now(tz_obj).date().timetuple())


def get_user_string(tz_obj, unixtime):
    user_time = datetime.datetime.utcfromtimestamp(unixtime).replace(tzinfo=pytz.UTC).astimezone(tz_obj)
    return user_time.strftime(DATE_FMT)


def get_utc_string(unixtime):
    return get_user_string(pytz.UTC, unixtime)
