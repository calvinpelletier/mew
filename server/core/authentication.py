import hashlib
import logging
import uuid

from log import *


def add_user(db, email, password):
    # TODO: check if email already in use
    # TODO: check that email is valid
    # TODO: raise exception when email is > 255 characters

    password_salt = uuid.uuid4().hex
    password_hash = hashlib.sha512(password + password_salt).hexdigest()

    c = db.cursor()
    c.execute('INSERT INTO users VALUES (NULL, ?, ?, ?)', (email, password_hash, password_salt))
    uid = c.lastrowid
    db.commit()
    c.close()

    return uid


def add_guest(db, token):
    c = db.cursor()
    c.execute('INSERT INTO users VALUES (NULL, NULL, NULL, NULL)')
    uid = c.lastrowid
    c.execute('INSERT INTO tokens VALUES (?, ?)', (token, uid))
    db.commit()
    c.close()

    info("Added new guest with uid=%d, token=%s", uid, token)

    return uid


# return uid for success and None for fail
def authenticate(db, email, password):
    c = db.cursor()
    c.execute('SELECT * FROM users WHERE email=?', (email,))
    user = c.fetchone()
    c.close()

    if user is None:
        return None  # incorrect username

    # TODO: find a way to access columns by name so we dont have to update this every time we change the table schema
    uid = user[1]
    password_hash = user[2]
    password_salt = user[3]

    if hashlib.sha512(password + password_salt).hexdigest() != password_hash:
        return None  # incorrect password

    return uid


def google_auth(db, email, google_uid):
    c = db.cursor()
    c.execute('SELECT * FROM google WHERE google_uid=?', (google_uid,))
    user = c.fetchone()
    c.close()

    if user is None:
        # create user
        c = db.cursor()
        c.execute('INSERT INTO users VALUES (NULL, email, NULL, NULL)')
        uid = c.lastrowid
        c.execute('INSERT INTO google VALUES (?, ?)', (google_uid, uid))
        db.commit()
        c.close()
    else:
        uid = user[2]

    return uid


def get_user_email(db, uid):
    """
    :return: email if uid is a logged in user, None if uid is a guest
    """

    c = db.cursor()
    c.execute("SELECT email from USERS where uid=?", (uid,))
    email = c.fetchone()[0]
    c.close()

    return email


def token_to_uid(db, token):
    c = db.cursor()
    c.execute('SELECT uid FROM tokens WHERE token=?', (token,))
    uid = c.fetchone()
    c.close()

    if uid is None:
        return None
    else:
        return uid[0]


def gen_token():
    return uuid.uuid4().hex
