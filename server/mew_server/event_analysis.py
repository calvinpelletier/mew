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


def get_last_x_days_summary(db, uid, x_days):
    date = datetime.date.today() - datetime.timedelta(days=x_days)
    start_time = calendar.timegm(date.timetuple()) * 1000
    events = event_storage.select(db, uid, start_time)

    prev_ts = None
    prev_hostname = None
    ret = []
    total = 0.
    for event in events:
        hostname = event[0]
        ts = event[1]
        date = datetime.date.fromtimestamp(ts / 1000).isoformat()
        if prev_ts is not None:
            if ts < prev_ts:
                raise Exception('events not in order')
            if ret[-1]['date'] != date:
                ret[-1]['summary']['total'] = total
                total = 0.
                ret.append({
                    'date': date,
                    'summary': {}
                })
            time = (ts - prev_ts) / (1000. * 60.) # ms to min
            if prev_hostname in ret[-1]['data']:
                ret[-1]['summary'][prev_hostname] += time
            else:
                ret[-1]['summary'][prev_hostname] = time
            total += time
        else:
            ret.append({
                'date': datetime.date.fromtimestamp(ts / 1000).isoformat(),
                'summary': {}
            })
        prev_ts = ts
        prev_hostname = hostname


def get_last_x_min(db, uid, x_min):
    if x_min:
        start_time = (time.time() - (x_min * 60.)) * 1000  # sec to ms
    else:
        start_time = None
    events = event_storage.select(db, uid, start_time)
    return events
