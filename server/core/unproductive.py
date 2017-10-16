import json


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
