import calendar
import datetime
from log import *

import pytz


def get_date_in_tz(tz_obj, utc_date):
    """
    TODO document this shit


    :param tz_obj: pytz timezone object, the user's timezone
    :param utc_date: either a timezone-naive datetime object, or a unixtime. It's a UTC-based representation of the LOCAL
        date.

        Example:
            If the user's local date in question is 3/4/2017, regardless of timezone,
            this input will be 3/4/2017 00:00:00 in UTC.
    :return:
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
    first_timestamp = datetime.datetime.utcfromtimestamp(utc_unixtime).replace(tzinfo=pytz.UTC).astimezone(tz_obj)
    return calendar.timegm(first_timestamp.date().timetuple())



