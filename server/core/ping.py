import time
from threading import Lock, Timer

from util import open_db
from event_storage import insert

"""
possible problems:
[probably fixed] send event then close chrome before the first ping is sent
[fixed] adding a token to last_active while the inspector is iterating over the dictionary would cause an exception
[TODO] stop pinging due to network problems, then resume pinging after we pronouced dead - TODO
"""

INSPECTION_INTERVAL = 60. # seconds
FATAL_TIME = 15. # seconds after which the inspector pronounces a client dead
ADJUSTMENT = 2.5 # seconds to add to last active time for null event. 2.5 is half of a ping interval so lowest average error


def init(database_path, web_event, logger):
    global last_active, DATABASE_PATH, WebEvent, lg, last_active_lock
    last_active = {}
    DATABASE_PATH = database_path
    WebEvent = web_event
    lg = logger
    last_active_lock = Lock()

    t = Timer(INSPECTION_INTERVAL, inspection)
    t.daemon = True
    t.start()

def rec(token, ts):
    last_active_lock.acquire()
    last_active[token] = ts
    last_active_lock.release()

def inspection():
    global last_active
    dead = []
    lg.info('[PING] running inspection.')

    last_active_lock.acquire()
    cur_time = time.time() * 1000 # sec to ms unixtime
    # IMPORTANT: WILL NOT WORK IN PYTHON 3
    # CHANGE TO list(last_active.items()) IF WE SWITCH
    for token, last_active_time in last_active.items():
        if last_active_time < cur_time - FATAL_TIME * 1000:
            dead.append((token, last_active_time))
            del last_active[token]
    last_active_lock.release()

    if len(dead) > 0:
        db = open_db(DATABASE_PATH) # need to open because we're outside app context
        for token, last_active_time in dead:
            lg.info('[PING] %s pronounced dead.', token)
            insert(db, WebEvent(
                token=token,
                hostname=None,
                time=int(last_active_time + ADJUSTMENT * 1000)
            ))
            db.close()

    t = Timer(INSPECTION_INTERVAL, inspection)
    t.daemon = True
    t.start()
