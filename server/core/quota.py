import event_analysis


def get_streak(db, uid, summary, tz):
    c = db.cursor()
    c.execute('SELECT quota, quota_type, streak, streak_last_updated, tz FROM quotas WHERE uid = ?', (uid,))
    result = c.fetchone()

    if result is None or result[1] == 0:
        # there's no quota set
        return -1

    quota, quota_type, old_streak, streak_last_updated, stored_tz = result

    if quota_type == 1:
        metric = '_total'
    elif quota_type == 2:
        metric = '_unprod'
    else:
        # should never happen
        # TODO: log
        return -1

    # make sure timezone is the same
    if stored_tz is None or stored_tz != tz:
        # recalculate entire streak
        old_streak = 0
        streak_last_updated = 0

    # find summary location of streak_last_updated
    if streak_last_updated < summary[0]['date']:
        slu_idx = 0
    else:
        assert int(streak_last_updated - summary[0]['date']) % 86400 == 0
        slu_idx = int(streak_last_updated - summary[0]['date']) /  86400

    # calculate new streak
    new_streak = 0
    for i in range(len(summary) - 1, slu_idx, -1):
        if summary[i]['summary'][metric] > quota:
            break
        new_streak += 1
        if i == slu_idx:
            new_streak += old_streak

    # update table
    today = calendar.timegm(datetime.datetime.now(pytz.timezone(tz)).date().timetuple()) # date (based on user's tz) encoded as UTC day start
    c.execute('INSERT OR REPLACE INTO quotas VALUES (?, ?, ?, ?, ?, ?)', (uid, quota, quota_type, new_streak, today, tz))
    db.commit()
    c.close()


def get_quota(db, uid):
    c = db.cursor()
    c.execute('SELECT quota, quota_type FROM quotas WHERE uid = ?', (uid,))
    result = c.fetchone()
    print 'quota:'
    print result

    if result is None:
        quota = 0
        quota_type = 'none'
        c.execute('INSERT INTO quotas VALUES (?, ?, ?, ?, ?, ?)', (uid, 0, 0, 0, 0, None))
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
    c.execute('INSERT OR REPLACE INTO quotas VALUES (?, ?, ?, ?, ?, ?)', (uid, new_quota, qt, 0, 0, None))
    db.commit()
    c.close()
