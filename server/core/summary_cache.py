import json
import event_storage
from collections import defaultdict

from log import *
from timezones import *


def update(db, uid, tz, today, data):
    c = db.cursor()
    for day, summary in data.iteritems():
        if day != today:
            summary_json = json.dumps(summary, separators=(',', ':'))
            c.execute(
                'INSERT INTO daily_summary_cache VALUES (?, ?, ?, ?)',
                (uid, tz, day, summary_json)
            )
    db.commit()
    c.close()


# RETURNS TUPLE OF:
# cached_data - {ut: {host: duration}},
# durations_per_host - {host: total_dur},
# events - [(host, ts)],
# first_non_cached_day - unixtime for start of utc day
def load(db, uid, tz):
    c = db.cursor()
    c.execute(
        'SELECT ts, json FROM daily_summary_cache WHERE uid = ? AND tz = ?',
        (uid, tz)
    )
    cache = c.fetchall()
    c.close()

    tz_obj = pytz.timezone(tz)
    durations_per_host = defaultdict(int)
    cache_data = {} # Map from unixtime -> {hostname: time spent}

    if len(cache) > 0:
        try:
            latest_cached = None # unixtime (utc) of last cached day
            for utc_day, json_summary in cache:
                cache_data[utc_day] = json.loads(json_summary)
                if latest_cached is None or utc_day > latest_cached:
                    latest_cached = utc_day
                # setup durations_per_host dict
                for host, total_time in cache_data[utc_day].iteritems():
                    if not host.startswith('_'): # skip _total and _unprod
                        durations_per_host[host] += total_time

            first_non_cached_day = (latest_cached + 86400) # unixtime of first non-cached utc day

            # unixtime of first non-cached LOCAL day:
            start_time = get_date_in_tz(tz_obj, first_non_cached_day)

            info("For user %d, the first non-cached day start is %s (%s)" % (
            uid, get_user_string(tz_obj, start_time), str(tz_obj)))

            events = event_storage.select(db, uid, start_time * 1000)
            return cache_data, durations_per_host, events, first_non_cached_day
        except Exception as ex:
            error(ex.message)
            pass

    # If control flow reaches here, either (a) there isn't cached data or (b) we failed to get the cached data
    events = event_storage.select(db, uid) # get all events
    if len(events) > 0:
        first_non_cached_day = get_unixdate_for_local_time(tz_obj, events[0][1] / 1000)
    else:
        first_non_cached_day = None

    return cache_data, durations_per_host, events, first_non_cached_day
