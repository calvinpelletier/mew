import hashlib
import uuid


def add_user(db, email, password):
    # TODO: check if email already in use
    # TODO: check that email is valid
    # TODO: raise exception when email is > 255 characters

    password_salt = uuid.uuid4().hex
    password_hash = hashlib.sha512(password + password_salt).hexdigest()

    c = db.cursor()
    c.execute('INSERT INTO users VALUES (NULL, ?, ?, ?)', (email, password_hash, password_salt))
    db.commit()
    c.close()


def add_guest(db, token):
    c = db.cursor()
    c.execute('INSERT INTO users VALUES (NULL, NULL, NULL, NULL)')
    uid = c.lastrowid
    c.execute('INSERT INTO tokens VALUES (?, ?)', (token, uid))
    db.commit()
    c.close()

    return uid


# return boolean for success/fail
def authenticate(db, email, password):
    c = db.cursor()
    c.execute('SELECT * FROM users WHERE email=?', (email,))
    user = c.fetchone()
    c.close()

    if user is None:
        return False  # incorrect username

    # TODO: find a way to access columns by name so we dont have to update this every time we change the table schema
    password_hash = user[2]
    password_salt = user[3]

    if hashlib.sha512(password + password_salt).hexdigest() != password_hash:
        return False  # incorrect password

    return True


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