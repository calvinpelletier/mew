import json
from util import clean_hostname
from summary_cache import recalc_unprod


# tz is used for recalculating unprod in cache
def set_unprod_sites(db, uid, sites, tz):
    print 'check0'
    if type(sites) not in [list, tuple] or len(sites) > 1000: # arbitrary limit
        # TODO log that we might be under attack
        return False

    clean_sites = [clean_hostname(site) for site in sites]

    sites_json = json.dumps(clean_sites, separators=(',',':'))
    if len(sites_json) > 1000000: # arbitrary limit
        # TODO log that we might be under attack
        return False

    # check that it's different
    c = db.cursor()
    c.execute('SELECT json FROM unprod_sites WHERE uid = ?', (uid,))
    result = c.fetchone()

    # if it's different
    if result is None or result[0] != sites_json:
        print 'check'
        c.execute('INSERT OR REPLACE INTO unprod_sites VALUES (?, ?)', (uid, sites_json))
        db.commit()
        recalc_unprod(db, uid, tz, clean_sites) # refresh cached unprod usage (see summary_cache.py)

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
