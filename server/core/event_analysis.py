import calendar
import datetime
import time
from collections import defaultdict

import pytz

import event_storage
import summary_cache
from log import *

# None/null means the user wasn't in chrome
IGNORED_HOSTNAMES = [None, "newtab"]


def get_last_x_min_summary(db, uid, x_min, max_sites):
    events = get_last_x_min(db, uid, x_min)

    prev_ts = None
    prev_hostname = None
    summary = {}
    total = 0.
    for event in events:
        hostname = event[0]
        ts = event[1]
        if prev_ts is not None and prev_hostname not in IGNORED_HOSTNAMES:
            if ts < prev_ts:
                # something went horribly wrong in our database
                # or someone removed ORDER BY from select statement
                raise Exception('events not in order')
            time = (ts - prev_ts) / (1000. * 60.) # ms to min
            if prev_hostname in summary:
                summary[prev_hostname] += time
            else:
                summary[prev_hostname] = time
            total += time
        prev_ts = ts
        prev_hostname = hostname

    sorted_summary = sorted(zip(summary.keys(), summary.values()), key=lambda pair: pair[1], reverse=True)
    other = sum(value for _, value in sorted_summary[max_sites:])
    ret = {
        'labels': [label for label, _ in sorted_summary[:max_sites]] + ['other'],
        'values': [value for _, value in sorted_summary[:max_sites]] + [other],
        'total': total
    }
    return ret


# I removed the last_x_days param because it makes our caching logic way more complicated
# and we probably weren't going to use it anyway
def get_daily_summary(db, uid, timezone_name):
    cache_data, durations_per_host, events, first_non_cached_day = summary_cache.load(db, uid, timezone_name)

    if first_non_cached_day is None:
        # no events
        return None

    # Initialize a list of datetimes, one for each day
    # Map from unixtime -> {hostname: time spent} (which is a defaultdict(int)
    new_data = {
        ut: defaultdict(int) for ut in range(first_non_cached_day, int(time.time()), 86400)
    }

    tz_obj = pytz.timezone(timezone_name)

    # summarize non cached events
    prev_ts = None
    prev_hostname = None
    prev_utc_day_start = None
    total = 0.
    for event in events:
        hostname = event[0]
        ts = event[1]

        # Event timestamp, in user's local timezone
        ts_sec = ts / 1000
        user_ts = datetime.datetime.utcfromtimestamp(ts_sec).replace(tzinfo=pytz.UTC).astimezone(tz_obj)
        user_day = user_ts.date()

        # A unixtime for midnight (in UTC!) of the day of this timestamp,
        # ***where the date is determined by the local time, NOT by UTC***
        utc_day_start = calendar.timegm(user_day.timetuple())

        # Ignore nulls, they mean the user wasn't even in Chrome.
        if prev_ts is not None and prev_hostname not in IGNORED_HOSTNAMES:
            day_diff = utc_day_start - prev_utc_day_start
            if day_diff % 86400 != 0:
                # there is fuckery about
                # possibly leap seconds
                error("utc_day_start is %s and prev_utc_day_start is %s which is not a multiple of 86400",
                    str(utc_day_start), str(prev_utc_day_start))
                raise

            # if this event is in one day
            if day_diff == 0:
                mins_elapsed = (ts - prev_ts) / (1000. * 60.)  # ms to min
                new_data[prev_utc_day_start][prev_hostname] += mins_elapsed
                durations_per_host[prev_hostname] += mins_elapsed

            # if this event overlaps two days
            if day_diff == 86400:
                day_division = time.mktime(user_day.timetuple()) # unixtime of local day (not utc)
                min_pre_division = (day_division - prev_ts / 1000.) / 60.
                min_post_division = (ts / 1000. - day_division) / 60.
                assert min_pre_division > 0 and min_post_division >= 0
                new_data[prev_utc_day_start][prev_hostname] += min_pre_division
                new_data[utc_day_start][prev_hostname] += min_post_division
                durations_per_host[prev_hostname] += min_pre_division + min_post_division

            # this event overlaps more than two days
            else:
                # first day (partial)
                # this could be faster by storing a prev_user_day but this will pretty much never occur so fuck it
                _y, _m, _d = [int(x) for x in datetime.datetime.utcfromtimestamp(prev_utc_day_start + 86400).date().isoformat().split('-')]
                day_division = time.mktime(datetime.datetime(_y, _m, _d, tzinfo=tz_obj).date().timetuple()) # unix time of local day
                min_pre_division = (day_division - prev_ts / 1000.) / 60.
                assert min_pre_division > 0
                new_data[prev_utc_day_start][prev_hostname] += min_pre_division

                # middle days (full)
                cur_day = prev_utc_day_start + 86400
                while cur_day < utc_day_start:
                    new_data[cur_day][prev_hostname] = 1440 # minutes in a day
                    cur_day += 86400

                # last day (partial)
                day_division = time.mktime(user_day.timetuple()) # unixtime of local day (not utc)
                min_post_division = (ts / 1000. - day_division) / 60.
                assert min_post_division >= 0
                new_data[utc_day_start][prev_hostname] += min_post_division

        prev_ts = ts
        prev_hostname = hostname
        prev_utc_day_start = utc_day_start

    # cache new findings
    cur_day = datetime.datetime.utcfromtimestamp(time.time()).replace(tzinfo=pytz.UTC).astimezone(tz_obj).date()
    cur_day_utc = calendar.timegm(cur_day.timetuple())
    summary_cache.update(db, uid, timezone_name, cur_day_utc, new_data)

    final_data = sorted([
        {
            "date" : utc_day,
            "summary" : summary_data
        }
        for utc_day, summary_data in cache_data.items() + new_data.items()
    ], key=lambda o: o["date"])

    hostnames = map(lambda (host,_): host, sorted(durations_per_host.items(), key=lambda (_, dur): dur, reverse=True))

    return {
        "data": final_data,
        "hostnames": hostnames
    }


def get_last_x_min(db, uid, x_min):
    if x_min:
        start_time = (time.time() - (x_min * 60.)) * 1000  # sec to ms
    else:
        start_time = None
    events = event_storage.select(db, uid, start_time)

    debug("Fetching %s from DB, for user %d, found %d events.", "last %d minutes" % x_min if x_min else "all data", uid,
          len(events))
    return events
