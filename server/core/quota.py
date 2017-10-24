import event_analysis

def get_streak(db, uid, summary):
    c = db.cursor()
    c.execute('SELECT quota, quota_type FROM quotas WHERE uid = ?', (uid,))
    result = c.fetchone()
    c.close()

    if result is None or result[1] == 0:
        # there's no quota set
        return -1

    quota, quota_type = result

    if quota_type == 1:
        metric = '_total'
    elif quota_type == 2:
        metric = '_unprod'
    else:
        # should never happen
        # TODO: log
        return -1

    # loop backwards over summary
    streak = 0
    for day in reversed(summary):
        if metric in day['summary'] and day['summary'][metric] > quota:
            break
        streak += 1

    # don't count current day
    if streak > 0:
        streak -= 1

    return streak


def get_quota(db, uid):
    c = db.cursor()
    c.execute('SELECT quota, quota_type FROM quotas WHERE uid = ?', (uid,))
    result = c.fetchone()

    if result is None:
        quota = 0
        quota_type = 'none'
        c.execute('INSERT INTO quotas VALUES (?, ?, ?)', (uid, 0, 0))
        db.commit()
    else:
        quota = result[0]
        qt = result[1]
        if qt == 1:
            quota_type = 'all'
        elif qt == 2:
            quota_type = 'unprod'
        else:
            quota_type = 'none'

    c.close()
    return quota, quota_type


def set_quota(db, uid, new_quota, quota_type):
    if new_quota < 0 or new_quota > 2147483647:
        return False

    if quota_type == 'none':
        qt = 0
    elif quota_type == 'all':
        qt = 1
    elif quota_type == 'unprod':
        qt = 2
    else:
        return False

    c = db.cursor()
    c.execute('INSERT OR REPLACE INTO quotas VALUES (?, ?, ?)', (uid, new_quota, qt))
    db.commit()
    c.close()
    return True
