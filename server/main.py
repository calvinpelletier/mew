import argparse
from os import environ, getcwd, path
from collections import namedtuple
from datetime import datetime
import time

from flask import Flask, render_template, request, make_response, redirect, session
from core.util import *

from google.oauth2 import id_token
from google.auth.transport import requests

from core import *
from core import authentication, event_storage, event_analysis, ping
from core.log import *

MEW_PATH = environ.get('MEW_PATH')
if not MEW_PATH:
    print 'You need to set $MEW_PATH.'
    exit(1)

WebEvent = namedtuple("WebEvent", "token hostname time")

app = Flask(__name__, root_path=path.join(MEW_PATH, 'server/'), static_url_path="/static")

init_loggers(MEW_PATH)

with open(path.join(MEW_PATH, "server/secret_key"), 'r') as secret_key_file:
    app.secret_key = secret_key_file.readline()


#########################################
# ENDPOINTS
#########################################

@app.route('/')
def get_landing_page():
    if 'uid' in session:
        return make_response(redirect('/graph'))
    else:
        return render_template('login.html')


@app.route('/guest/<token>')
def redirect_guest(token):
    redirect_to_index = redirect('/graph')
    response = make_response(redirect_to_index)

    uid = authentication.token_to_uid(get_db(DATABASE_PATH), token)
    if uid is None:
        uid = authentication.add_guest(get_db(DATABASE_PATH), token)

    session['uid'] = uid
    info("Redirecting (and setting uid cookie for token %s to %d)" % (token, uid))

    return response


@app.route('/graph/')
def graph():
    fake_labels = ['reddit.com', 'facebook.com', 'youtube.com', 'OTHER']
    fake_values = [45, 28, 27, 36]
    return render_template('graph.html', labels=fake_labels, values=fake_values)


@app.route('/api/login', methods=['POST'])
def login():
    req_data = request.get_json()
    email = req_data['email']
    if 'google_token' in req_data:
        token = req_data['google_token']
        try:
            idinfo = id_token.verify_oauth2_token(token, requests.Request(), '385569473349-1192ich7o73apbpmu48c4lc32soqgqjk.apps.googleusercontent.com')
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                # someone is trying to fuck with us
                return gen_resp(False) # TODO: log
            google_uid = idinfo['sub']
        except ValueError:
            # invalid google token
            return gen_resp(False) # TODO: log
        uid = authentication.google_auth(get_db(DATABASE_PATH), email, google_uid)
    else:
        password = req_data['password']
        uid = authentication.authenticate(get_db(DATABASE_PATH), email, password)
    if uid is None:
        return gen_resp(False)
    else:
        session['uid'] = uid
        return gen_resp(True)


@app.route('/api/logout')
def logout():
    session.pop('uid', None)
    return redirect('/')


@app.route('/api/signup', methods=['POST'])
def signup():
    email = request.form['email']
    password = request.form['password']
    uid = authentication.add_user(get_db(DATABASE_PATH), email, password)
    if uid is None:
        # TODO: unique response for each error
        pass
    else:
        session['uid'] = uid
        return make_response(redirect('/graph'))


@app.route('/api/ping', methods=['POST'])
def rec_ping():
    req = request.get_json()
    try:
        token = req['token']
        ts = req['time']
    except:
        warn('Possible attack from ip: %s', request.environ['REMOTE_ADDR'])
        return gen_resp(False, {})

    ping.rec(token, ts)
    return gen_resp(True, {})


@app.route('/api/gentoken', methods=['POST'])
def gen_token():
    token = authentication.gen_token()
    response = {
        'success': True,
        'token': token
    }
    return jsonify(response)


@app.route('/api/addevent', methods=['POST'])
def add_event():
    req_data = request.get_json()

    # TODO:
    #   log failures
    #   return an actual response, not strings
    try:
        event = WebEvent(**req_data)
        event_storage.insert(get_db(DATABASE_PATH), event)
        ping.rec(event.token, event.time) # in case they send an event then close chrome before a ping is sent
        return 'Successfully added an event.', 200
    except Exception as ex:
        error("Failed to add an event '%s': %s", str(req_data), ex.message)
        return "Failed to add an event", 400


@app.route('/api/bargraph', methods=['POST'])
def get_bar_graph_data():
    req_data = request.get_json()
    num_minutes = req_data['minutes']
    max_sites = req_data['max_sites']

    if 'uid' in session:
        uid = session['uid']
    else:
        # not logged in
        return gen_resp(False, {"reason": "No uid found."})

    summary = event_analysis.get_last_x_min_summary(get_db(DATABASE_PATH), uid, num_minutes, max_sites)
    return gen_resp(True, summary)


@app.route('/api/stackedgraph', methods=['POST'])
def get_stacked_graph_data():
    req_data = request.get_json()

    if not req_data:
        return gen_resp("False")

    num_days = req_data['days']
    timezone = req_data['timezone']

    if 'uid' in session:
        uid = session['uid']
    else:
        # not logged in
        return gen_resp(False, {"reason": "No uid found."})

    summary = event_analysis.get_daily_summary(get_db(DATABASE_PATH), uid, timezone)
    if summary is None:
        return gen_resp(False, {'reason', 'no events'})
    # debug(summary)
    return gen_resp(True, summary)


@app.route('/api/getstreak', methods=['POST'])
def get_streak():
    if 'uid' in session:
        uid = session['uid']
    else:
        return gen_resp(False, {'reason': 'No uid found.'})

    streak = quota.get_streak(get_db(DATABASE_PATH), uid)
    return gen_resp(True, {'streak': streak})


# sets or gets quota depending on req type
@app.route('/api/quota', methods=['POST', 'GET'])
def set_get_quota():
    if 'uid' in session:
        uid = session['uid']
    else:
        return gen_resp(False, {'reason': 'No uid found.'})

    if request.methods == 'POST':
        req_data = request.get_json()
        try:
            new_quota = int(req_data['quota'])
        except:
            return gen_resp(False, {'reason': 'invalid or missing quota'})
        success = quota.set_quota(get_db(DATABASE_PATH), uid, new_quota)
        return gen_resp(success)
    else: # get
        ret = quota.get_quota(get_db(DATABASE_PATH), uid)
        # ret == 0 means no quota set
        return gen_resp(True, {'quota': ret})


# sets or gets list of unproductive sites deending on req type
@app.route('/api/unprodsites', methods=['POST', 'GET'])
def set_get_unprod_sites():
    if 'uid' in session:
        uid = session['uid']
    else:
        return gen_resp(False, {'reason': 'No uid found.'})

    if request.methods == 'POST':
        req_data = request.get_json()
        if 'sites' not in req_data:
            return gen_resp(False, {'reason': 'missing sites'})
        success = quota.set_unprod_sites(get_db(DATABASE_PATH), uid, req_data['sites'])
        return gen_resp(success)
    else: # get
        sites = quota.get_unprod_sites(get_db(DATABASE_PATH), uid)
        return gen_resp(True, {'sites': sites})


@app.route('/api/debug/data', methods=['GET'])
def get_user_website_data():
    try:
        mins = float(request.args.get('minutes'))
    except:
        return gen_fail("Couldn't parse minutes parameter '%s'" % str(request.args.get('minutes')))

    if 'uid' in session:
        uid = session['uid']
    else:
        # not logged in
        return gen_resp(False, {"reason": "No uid found."})

    db = get_db(DATABASE_PATH)
    events = event_analysis.get_last_x_min(db, uid, mins)

    result = []
    for e in events:
        result.append({
            'hostname': e[0],
            'time': e[1],
            'utc_str': datetime.utcfromtimestamp(e[1] / 1000).strftime('%Y-%m-%dT%H:%M:%SZ')

        })

    return gen_resp(True, {'data': result})


#########################################
# HELPER METHODS
#########################################

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()


def setup():
    global DATABASE_PATH
    DATABASE_PATH = environ.get('MEW_DB_PATH')
    if not DATABASE_PATH:
        print 'You need to set $MEW_DB_PATH.'
        exit(1)

    ping.init(DATABASE_PATH, WebEvent)


#########################################
# MAIN ENTRY POINT OF FLASK APP
#########################################

if __name__ == "__main__":
    # Set up CLI args
    parser = argparse.ArgumentParser(description='Mew Server')
    parser.add_argument('-v', '--verbose', action='store_true', help="Verbose logging")
    cli_args = parser.parse_args()

    if cli_args.verbose:
        info("Using verbose logging.")
        level = logging.DEBUG
    setup()

    app.run(host='127.0.0.1', debug=True)
