import event_analysis

def get_streak(db, uid, summary):
    c = db.cursor()
    c.execute('SELECT quota, quota_type FROM quotas WHERE uid = ?', (uid,))
    result = c.fetchone()
    c.close()

    if result is None or result[1] == 0:
        # there's no quota set
        return -1, -1

    quota, quota_type = result

    if quota_type == 1:
        metric = '_total'
    elif quota_type == 2:
        metric = '_unprod'
    else:
        # should never happen
        # TODO: log
        return -1, -1

    # loop backwards over summary
    streak = 0
    for day in reversed(summary):
        if metric in day['summary'] and day['summary'][metric] > quota:
            break
        streak += 1

    # don't count current day
    if streak > 0:
        streak -= 1

    # get current day's usage (for getmaindata api)
    if quota > 0:
        percent_usage = int(100. * summary[-1]['summary'][metric] / quota)
    else:
        # TODO: proper way to do 0 quotas?
        if int(summary[-1]['summary'][metric]) == 0:
            percent_usage = 0
        else:
            percent_usage = 101 # anything over 100 gets displayed as >100% on frontend

    return streak, percent_usage


def get_quota(db, uid):
    c = db.cursor()
    c.execute('SELECT quota, quota_type, quota_unit FROM quotas WHERE uid = ?', (uid,))
    result = c.fetchone()

    if result is None:
        quota = 0
        quota_type = 'none'
        quota_unit = 'minutes'
        c.execute('INSERT INTO quotas VALUES (?, ?, ?, ?)', (uid, 0, 0, 0))
        db.commit()
    else:
        quota, qt, qu = result
        if qt == 1:
            quota_type = 'all'
        elif qt == 2:
            quota_type = 'unprod'
        else:
            quota_type = 'none'

        if qu == 1:
            quota_unit = 'hours'
        else:
            quota_unit = 'minutes'

    c.close()
    return quota, quota_type, quota_unit


def set_quota(db, uid, new_quota, quota_type, quota_unit):
    if new_quota < 0 or new_quota > 2147483647:
        return -1

    if quota_type == 'none':
        qt = 0
    elif quota_type == 'all':
        qt = 1
    elif quota_type == 'unprod':
        qt = 2
    else:
        return -1

    if quota_unit == 'minutes':
        qu = 0
    elif quota_unit == 'hours':
        qu = 1
    else:
        return -1

    c = db.cursor()
    c.execute('SELECT quota, quota_type, quota_unit FROM quotas WHERE uid = ?', (uid,))
    result = c.fetchone()

    if result is None or result[0] != new_quota or result[1] != qt or result[2] != qu:
        c.execute('INSERT OR REPLACE INTO quotas VALUES (?, ?, ?, ?)', (uid, new_quota, qt, qu))
        db.commit()
        c.close()
        return 1 # changed

    c.close()
    return 0 # no change
