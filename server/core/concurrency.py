from threading import Lock
from log import *

"""
identifier: string used for grouping together operations that can't run simultaneously for the same user

USAGE:
from concurrency import UserLock
with UserLock(<identifier>, <uid>):
    <code>

MANUAL LOCKING/UNLOCKING:
you can manually lock and unlock with acquire(identifier, uid) and release(identifier, uid)
Warning: if an exception occurs before releasing, the lock will be stuck. Safer to use 'with'.

init() is only called on server start
"""

def init():
    global user_locks, master_lock
    user_locks = {}
    master_lock = Lock()


def acquire(identifier, uid):
    global user_locks, master_lock

    if identifier not in user_locks:
        user_locks[identifier] = {}

    if uid not in user_locks[identifier]:
        with master_lock:
            # recheck that lock hasnt already been created
            if uid not in user_locks[identifier]:
                user_locks[identifier][uid] = Lock()

    user_locks[identifier][uid].acquire()


def release(identifier, uid):
    global user_locks, master_lock

    if identifier not in user_locks or uid not in user_locks[identifier]:
        warn('releasing user lock without first acquiring')
        return

    user_locks[identifier][uid].release()


class UserLock:
    def __init__(self, identifier, uid):
        self.identifier = identifier
        self.uid = uid

    def __enter__(self):
        acquire(self.identifier, self.uid)

    def __exit__(self, type, value, traceback):
        release(self.identifier, self.uid)
        return False # dont suppress any exceptions
