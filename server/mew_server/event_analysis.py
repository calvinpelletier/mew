from collections import defaultdict
import datetime
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


def get_last_x_days_summary(db, uid, timezone_offset, x_days=None):
    if x_days:
        date = datetime.date.today() - datetime.timedelta(days=x_days)
        start_time = calendar.timegm(date.timetuple()) * 1000
    else:
        start_time = None
    events = event_storage.select(db, uid, start_time)

    durations_per_host = defaultdict(int)

    prev_ts = None
    prev_hostname = None
    ret = []
    total = 0.
    for event in events:
        hostname = event[0]
        ts = event[1]
        date = ts / 1000
        user_ts = datetime.datetime.utcfromtimestamp(date) - datetime.timedelta(minutes=timezone_offset)
        user_day = datetime.datetime(year=user_ts.year, month=user_ts.month, day=user_ts.day)
        user_day_unixtime = time.mktime((user_day + datetime.timedelta(minutes=timezone_offset)).timetuple())

        if prev_ts is not None:
            if ts < prev_ts:
                raise Exception('events not in order')
            if ret[-1]['date'] != user_day_unixtime:
                ret[-1]['summary']['total'] = total
                total = 0.

                ret.append({
                    'date': user_day_unixtime,
                    'summary': {}
                })
            mins_elapsed = (ts - prev_ts) / (1000. * 60.) # ms to min
            if prev_hostname in ret[-1]['summary']:
                ret[-1]['summary'][prev_hostname] += mins_elapsed
            else:
                ret[-1]['summary'][prev_hostname] = mins_elapsed
            durations_per_host[prev_hostname] += mins_elapsed
            total += mins_elapsed
        else:
            ret.append({
                'date': user_day_unixtime,
                'summary': {}
            })
        prev_ts = ts
        prev_hostname = hostname

    hostnames = map(lambda (host,_): host, sorted(durations_per_host.items(), key=lambda (_, dur): dur, reverse=True))

    return {
        "data": ret,
        "hostnames": hostnames
    }


def get_last_x_min(db, uid, x_min):
    if x_min:
        start_time = (time.time() - (x_min * 60.)) * 1000  # sec to ms
    else:
        start_time = None
    events = event_storage.select(db, uid, start_time)
    return events
