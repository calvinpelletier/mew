import calendar
from collections import defaultdict
import datetime
import pytz
import time

import event_storage


def get_last_x_min_summary(db, uid, x_min, max_sites):
    events = get_last_x_min(db, uid, x_min)

    prev_ts = None
    prev_hostname = None
    summary = {}
    total = 0.
    for event in events:
        hostname = event[0]
        ts = event[1]
        if prev_ts is not None:
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


def get_last_x_days_summary(db, uid, timezone_name, x_days=None):
    if x_days:
        date = datetime.date.today() - datetime.timedelta(days=x_days)
        start_time = calendar.timegm(date.timetuple()) * 1000
    else:
        start_time = None
    events = event_storage.select(db, uid, start_time)

    # Initialize a list of datetimes, one for each day
    tz_obj = pytz.timezone(timezone_name)
    first_timestamp = datetime.datetime.utcfromtimestamp(events[0][1] / 1000).replace(tzinfo=pytz.UTC).astimezone(tz_obj)
    first_day = calendar.timegm(first_timestamp.date().timetuple())

    # Map from unixtime -> {hostname: time spent} (which is a defaultdict(int)
    bucketed_data = {
        ut: defaultdict(int) for ut in range(first_day, int(time.time()), 86400)
    }

    durations_per_host = defaultdict(int)

    prev_ts = None
    prev_hostname = None

    total = 0.
    for event in events:
        hostname = event[0]
        ts = event[1]
        date = ts / 1000

        # Event timestamp, in user's local timezone
        user_ts = datetime.datetime.utcfromtimestamp(date).replace(tzinfo=pytz.UTC).astimezone(tz_obj)
        user_day = user_ts.date()

        # A unixtime for midnight (in UTC!) of the day of this timestamp,
        # ***where the date is determined by the local time, NOT by UTC***
        utc_day_start = calendar.timegm(user_day.timetuple())

        # Ignore nulls, they mean the user wasn't even in Chrome.
        if prev_ts is not None and prev_hostname is not None:
            mins_elapsed = (ts - prev_ts) / (1000. * 60.)  # ms to min
            bucketed_data[utc_day_start][prev_hostname] += mins_elapsed
            durations_per_host[prev_hostname] += mins_elapsed
        prev_ts = ts
        prev_hostname = hostname

    final_data = sorted([
        {
            "date" : utc_day,
            "summary" : summary_data
        }
        for utc_day, summary_data in bucketed_data.items()
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
    return events
