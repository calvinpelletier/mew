import event_analysis


def get_streak(db, uid):
    c = db.cursor()
    c.execute('SELECT quota, quota_type, streak, streak_last_updated FROM quotas WHERE uid = ?', (uid,))
    result = c.fetchone()

    if result is None or result[0] == 0 or result[1] == 0:
        # there's no quota set
        return -1

    quota = result[0]
    quota_type = results[1]
    old_streak = result[2]
    streak_last_updated = result[3]

    # check if we dont need to do anything

    # get summary

    # calculate new streak

    # update table

def get_quota(db, uid):
    c = db.cursor()
    c.execute('SELECT quota, quota_type FROM quotas WHERE uid = ?', (uid,))
    result = c.fetchone()
    print 'quota:'
    print result

    if result is None:
        quota = 0
        quota_type = 'none'
        c.execute('INSERT INTO quotas VALUES (?, ?, ?, ?)', (uid, 0, 0, 0, 0))
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
    if new_quota <= 0 or new_quota > 2147483647:
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
    c.execute('INSERT OR REPLACE INTO quotas VALUES (?, ?, ?, ?)', (uid, new_quota, qt, 0, 0))
    db.commit()
    c.close()
