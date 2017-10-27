import sqlite3
import log
from flask import g, jsonify

def clean_hostname(hostname):
    if hostname is None:
        return hostname
    if hostname.startswith('www.'):
        return hostname[4:] # strip www.
    if hostname.startswith('m.'):
        return hostname[2:] # strip m.
    return hostname

def gen_resp(success, data=None):
    resp = {'success': success}
    if data is not None:
        for key, value in data.iteritems():
            if key == 'success':
                raise Exception('redundant success in resp')
            resp[key] = value
    log.debug("Response generated: " + ", ".join([str(key) + "=" + str(value) for key,value in resp.items()]))
    return jsonify(resp)


def gen_fail(reason):
    return gen_resp(False, {"reason": reason})


def get_db(database_path):
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(database_path)
    return db


def open_db(database_path):
    return sqlite3.connect(database_path)
