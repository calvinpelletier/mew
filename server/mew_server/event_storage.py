import authentication


def insert(db, web_event):
    # currently the only case we handle:
    uid = authentication.token_to_uid(db, web_event.token)
    if uid is None:
        uid = authentication.add_guest(db, web_event.token)
    c = db.cursor()
    c.execute('INSERT INTO events VALUES (?, ?, ?)', (uid, web_event.hostname, web_event.time))
    db.commit()
    c.close()


# start_time/end_time in unixtime (ms)
def select(db, uid, start_time, end_time=None):
    c = db.cursor()
    if end_time is None:
        c.execute('SELECT hostname, ts FROM events WHERE uid = ? AND ts > ? ORDER BY ts ASC', (uid, start_time))
    else:
        c.execute('SELECT hostname, ts FROM events WHERE uid = ? AND ts > ? AND ts < ? ORDER BY ts ASC', (uid, start_time, end_time))
    events = c.fetchall()
    c.close()

    return events
