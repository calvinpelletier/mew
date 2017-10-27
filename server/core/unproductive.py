import json
from util import clean_hostname


def set_unprod_sites(db, uid, sites):
    if type(sites) not in [list, tuple] or len(sites) > 1000: # arbitrary limit
        return False

    sites = [clean_hostname(site) for site in sites]

    sites_json = json.dumps(sites, separators=(',',':'))
    if len(sites_json) > 1000000: # arbitrary limit
        return False

    c = db.cursor()
    c.execute('INSERT OR REPLACE INTO unprod_sites VALUES (?, ?)', (uid, sites_json))
    db.commit()
    c.close()
    return True

def get_unprod_sites(db, uid):
    c = db.cursor()
    c.execute('SELECT json FROM unprod_sites WHERE uid = ?', (uid,))
    result = c.fetchone()

    if result is None:
        sites = []
        c.execute('INSERT INTO unprod_sites VALUES (?, ?)', (uid, '[]'))
        db.commit()
    else:
        sites = json.loads(result[0])

    c.close()
    return sites
