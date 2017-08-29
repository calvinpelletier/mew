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
