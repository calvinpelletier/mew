import time
from collections import defaultdict

import event_storage
import summary_cache
import unproductive
from log import *
from util import clean_hostname
from timezones import *
from concurrency import UserLock

# None/null means the user wasn't in chrome
IGNORED_HOSTNAMES = [None, "newtab"]


def get_last_x_min_summary(db, uid, x_min, max_sites):
    events = _get_last_x_min(db, uid, x_min)

    if len(events) == 0:
        info("No events found for uid %s, num_mins %s", str(uid), str(x_min))
        return {
            'labels': [],
            'values': [],
            'total': 0.
        }

    # insert null event at current time to capture last event
    cur_time = time.time() * 1000.
    if events[-1][1] > cur_time:
        # TODO: proper way to handle this?
        cur_time = events[-1][1]
    events.append([None, cur_time])

    prev_ts = None
    prev_hostname = None
    summary = {}
    total = 0.
    for event in events:
        hostname = clean_hostname(event[0])
        ts = event[1]
        if prev_ts is not None and prev_hostname not in IGNORED_HOSTNAMES:
            if ts < prev_ts:
                # something went horribly wrong in our database
                # or someone removed ORDER BY from select statement
                raise Exception('events not in order')
            dur = (ts - prev_ts) / (1000. * 60.) # ms to min
            if prev_hostname in summary:
                summary[prev_hostname] += dur
            else:
                summary[prev_hostname] = dur
            total += dur
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
def get_daily_summary(db, uid, timezone_name, max_sites=None):
    with UserLock('summary_cache', uid):
        cache_data, durations_per_host, events, first_non_cached_day = summary_cache.load(db, uid, timezone_name)

        if first_non_cached_day is None:
            # no events
            return None

        tz_obj = pytz.timezone(timezone_name)

        last_non_cached_day = cur_unixdate_for_tz(tz_obj)

        # Initialize a list of datetimes, one for each day
        # Map from utc unixdate -> {hostname: time spent} (which is a defaultdict(int)
        new_data = {
            ut: defaultdict(int) for ut in range(first_non_cached_day, last_non_cached_day + 1, 86400)
        }

        if len(events) != 0:
            unprod_sites = frozenset(unproductive.get_unprod_sites(db, uid)) # list -> frozenset for performance gain

            # insert null event at current time to capture last event and avoid an edge case in quota
            # TODO: this creates an issue of its own. make sure the null event doesnt affect the cache
            cur_time = time.time() * 1000.
            if events[-1][1] > cur_time:
                # TODO: proper way to handle this?
                cur_time = events[-1][1] + 1
            events.append([None, cur_time])

            # summarize non cached events
            prev_ts = None
            prev_hostname = None
            prev_unixdate = None
            total = 0.
            for event in events:
                hostname = clean_hostname(event[0])
                ts = event[1] / 1000

                # A unixtime for midnight (in UTC!) of the day of this timestamp,
                # ***where the date is determined by the local time, NOT by UTC***
                unixdate = get_unixdate_for_local_time(tz_obj, ts)

                # Ignore nulls, they mean the user wasn't even in Chrome.
                if prev_ts is not None and prev_hostname not in IGNORED_HOSTNAMES:
                    day_diff = unixdate - prev_unixdate
                    if day_diff % 86400 != 0:
                        # there is fuckery about
                        # possibly leap seconds
                        error("unixdate is %s and prev_unixdate is %s which is not a multiple of 86400",
                            str(unixdate), str(prev_unixdate))
                        raise

                    # if this event is in one day
                    if day_diff == 0:
                        mins_elapsed = (ts - prev_ts) / 60.
                        _add_to_summary(new_data, durations_per_host, unprod_sites, prev_unixdate, prev_hostname, mins_elapsed)

                    # if this event overlaps two days
                    elif day_diff == 86400:
                        day_division = local_unixdate_from_utc_unixdate(tz_obj, unixdate) # unixtime of local day (not utc)
                        min_pre_division = (day_division - prev_ts) / 60.
                        min_post_division = (ts - day_division) / 60.
                        _add_to_summary(new_data, durations_per_host, unprod_sites, prev_unixdate, prev_hostname, min_pre_division)
                        _add_to_summary(new_data, durations_per_host, unprod_sites, unixdate, prev_hostname, min_post_division)

                    # this event overlaps more than two days
                    else:
                        # first day (partial)
                        day_division = local_unixdate_from_utc_unixdate(tz_obj, prev_unixdate + 86400) # unixtime of local day (not utc)
                        min_pre_division = (day_division - prev_ts) / 60.
                        _add_to_summary(new_data, durations_per_host, unprod_sites, prev_unixdate, prev_hostname, min_pre_division)

                        # middle days (full)
                        cur_day = prev_unixdate + 86400
                        while cur_day < unixdate:
                            _add_to_summary(new_data, durations_per_host, unprod_sites, cur_day, prev_hostname, 1440) # min in day
                            cur_day += 86400

                        # last day (partial)
                        day_division = local_unixdate_from_utc_unixdate(tz_obj, unixdate) # unixtime of local day (not utc)
                        min_post_division = (ts - day_division) / 60.
                        _add_to_summary(new_data, durations_per_host, unprod_sites, unixdate, prev_hostname, min_post_division)

                prev_ts = ts
                prev_hostname = hostname
                prev_unixdate = unixdate

            # cache new findings
            cur_day_utc = cur_unixdate_for_tz(tz_obj)
            summary_cache.update(db, uid, timezone_name, cur_day_utc, new_data)

        else:
            # len(events) == 0
            # TODO: we should maybe do something?
            pass

    # end 'with UserLock...'

    final_data = sorted([
        {
            "date" : utc_day,
            "summary" : summary_data
        }
        for utc_day, summary_data in cache_data.items() + new_data.items()
    ], key=lambda o: o["date"])

    hostnames = map(lambda (host,_): host, sorted(durations_per_host.items(), key=lambda (_, dur): dur, reverse=True))
    hostnames = ['_total', '_unprod'] + hostnames # add total and unprod to top of the list
    if max_sites is not None and max_sites >= 1 and max_sites < len(hostnames):
        hostnames = hostnames[:max_sites]

    return {
        "data": final_data,
        "hostnames": hostnames
    }


# helper for get_daily_summary
def _add_to_summary(summary, dur_per_host, unprod_sites, day, site, duration):
    summary[day][site] += duration
    dur_per_host[site] += duration
    summary[day]['_total'] += duration
    if site in unprod_sites:
        summary[day]['_unprod'] += duration


def _get_last_x_min(db, uid, x_min):
    if x_min:
        start_time = (time.time() - (x_min * 60.)) * 1000  # sec to ms
    else:
        start_time = None
    events = event_storage.select(db, uid, start_time)

    debug("Fetching %s from DB, for user %d, found %d events.", "last %d minutes" % x_min if x_min else "all data", uid,
          len(events))
    return events
