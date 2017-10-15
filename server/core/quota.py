import json

def get_streak(db, uid):
    pass

def set_unprod_sites(db, uid, sites):
    if type(sites) not in [list, tuple] or len(sites) > 1000: # arbitrary limit
        return False

    sites_json = json.dumps(sites, separators=(',',':'))
    if len(sites_json) > 1000000: # arbitrary limit
        return False

    c = db.cursor()
    c.execute('INSERT OR REPLACE INTO unprod_sites VALUES (?, ?)', (uid, sites_json))
    db.commit()
    c.close()

def get_unprod_sites(db, uid):
    c = db.cursor()
    c.execute('SELECT json FROM unprod_sites WHERE uid = ?', (uid,))
    result = c.fetchone()
    print 'unprod sites:'
    print result

    if result is None:
        sites = []
        c.execute('INSERT INTO unprod_sites VALUES (?, ?)', (uid, '[]'))
        db.commit()
    else:
        sites = json.loads(result)

    c.close()
    return sites

def get_quota(db, uid):
    c = db.cursor()
    c.execute('SELECT quota FROM quotas WHERE uid = ?', (uid,))
    quota = c.fetchone()
    print 'quota:'
    print quota

    if quota is None:
        quota = 0
        c.execute('INSERT INTO quotas VALUES (?, ?, ?, ?)', (uid, 0, 0, 0))
        db.commit()

    c.close()
    return quota

def set_quota(db, uid, new_quota):
    if new_quota <= 0 or new_quota > 2147483647:
        return False

    c = db.cursor()
    c.execute('SELECT quota, streak, streak_last_updated FROM quotas WHERE uid = ?', (uid,))
    result = c.fetchone()
    print 'original quota:'
    print quota

    if result is None:
        c.execute('INSERT INTO quotas VALUES (?, ?, ?, ?)', (uid, new_quota, 0, 0))
        db.commit()
    else:
        old_quota = result[0]
        if old_quota != new_quota:
            streak = result[1]
            streak_last_updated = result[2]
            c.execute('INSERT OR REPLACE INTO quotas VALUES (?, ?, ?, ?)', (uid, new_quota, streak, streak_last_updated))
    c.close()
