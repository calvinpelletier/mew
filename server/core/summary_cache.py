import json

def update(db, uid, tz, data):
    c = db.cursor()
    for day, summary in data.iteritems():
        summary_json = json.dumps(summary, separators=(',', ':'))
        c.execute(
            'INSERT INTO daily_summary_cache VALUES (?, ?, ?, ?)',
            (uid, tz, day, summary_json)
        )
    db.commit()
    c.close()

def load(db, uid, tz, earliest_day):
    c = db.cursor()
    c.execute(
        'SELECT * FROM daily_summary_cache WHERE uid = ? AND tz = ? AND day >= ?',
        (uid, tz, earliest_day)
    )
    results = c.fetchall()
    c.close()
    return results
