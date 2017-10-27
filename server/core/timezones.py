import calendar
import datetime

import pytz

from log import *


def get_date_in_tz(tz_obj, utc_date):
    """
    Takes a utc date, at midnight. (either a unixtime or actual datetime) Converts that into the same date, but in the
    users timezone, and returns the unixtime representation of that date.

    :param tz_obj: pytz timezone object, the user's timezone
    :param utc_date: either a timezone-naive datetime object, or a unixtime. It's a UTC-based representation of the LOCAL
        date.

        Example:
            If the user's local date in question is 3/4/2017, regardless of timezone,
            this input will be 3/4/2017 00:00:00 in UTC.
    """

    if isinstance(utc_date, datetime.datetime):
        pass
    elif type(utc_date) == int:
        utc_date = datetime.datetime.utctimetuple(utc_date)
    else:
        error("Invalid parameter type for utc_date: ",type(utc_date))
        return None

    loc_datetime = tz_obj.localize(datetime.datetime(utc_date.year, utc_date.month, utc_date.day, 0, 0, 0, 0))
    loc_unixdate = calendar.timegm(loc_datetime.utctimetuple())
    return loc_unixdate


def get_unixdate_for_local_time(tz_obj, utc_unixtime):
    """
    Takes a unixtime (could be anytime, not just midnight), converts into the user's timezone, and returns a unixtime
    representation of that date, but in UTC.

    Example:
        Input: tz_obj=EST, utc_unixtime=1485910800 (2/1/2017 at 1am, UTC)
        Output: Unixtime for 1/31/2017 at midnight, UTC. The user's date is actually on 1/31 (because they're in EST).

    :param tz_obj: pytz timezone object, the user's timezone
    :param utc_unixtime: no special characteristics, just a UTC timestamp straight from the DB, in seconds.
    """
    first_timestamp = datetime.datetime.utcfromtimestamp(utc_unixtime).replace(tzinfo=pytz.UTC).astimezone(tz_obj)
    return calendar.timegm(first_timestamp.date().timetuple())



