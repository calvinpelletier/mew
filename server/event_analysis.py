import event_storage
import time


def get_last_x_min_summary(db, uid, x_min, max_sites):
    events = get_last_x_min(db, uid, x_min)

    prev_ts = None
    prev_hostname = None
    summary = {}
    for event in events:
        hostname = event[0]
        ts = event[1]
        if prev_ts is not None:
            if ts < prev_ts:
                # something went horribly wrong in our database
                # or someone removed ORDER BY from select statement
                raise Exception('events not in order')
            if hostname in summary:
                summary[hostname] += (ts - prev_ts) / (1000. * 60.) # ms to min
            else:
                summary[hostname] = (ts - prev_ts) / (1000. * 60.)
        prev_ts = ts
        prev_hostname = hostname

    sorted_summary = sorted(zip(summary.keys(), summary.values()), key=lambda pair: pair[1], reverse=True)
    other = sum(value for _, value in sorted_summary[max_sites:])
    ret = {
        'labels': [label for label, _ in sorted_summary[:max_sites]] + ['other'],
        'values': [value for _, value in sorted_summary[:max_sites]] + [other]
    }
    return ret

# TODO: method for graphing usage changes over time
#def get_last_x_days_summary(db, uid, x_days, max_sites)

def get_last_x_min(db, uid, x_min):
    start_time = (time.time() - (x_min * 60.)) * 1000  # sec to ms
    events = event_storage.select(db, uid, start_time)
    return events
